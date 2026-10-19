-- Real user profiles, reviews, replies and likes backed by Supabase.
-- All privileged operations are enforced in PostgreSQL, not in the browser.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 100),
  avatar_url text not null default '',
  role text not null default 'user' check (role in ('user', 'vip', 'admin')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text;
begin
  requested_role := coalesce(new.raw_app_meta_data ->> 'role', 'user');

  insert into public.profiles (id, display_name, avatar_url, role, status, created_at)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      split_part(coalesce(new.email, 'member'), '@', 1)
    ),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', ''),
    case when requested_role in ('user', 'vip', 'admin') then requested_role else 'user' end,
    'active',
    coalesce(new.created_at, now())
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id, display_name, avatar_url, role, status, created_at)
select
  users.id,
  coalesce(
    nullif(trim(users.raw_user_meta_data ->> 'display_name'), ''),
    nullif(trim(users.raw_user_meta_data ->> 'name'), ''),
    split_part(coalesce(users.email, 'member'), '@', 1)
  ),
  coalesce(users.raw_user_meta_data ->> 'avatar_url', ''),
  case
    when users.raw_app_meta_data ->> 'role' in ('user', 'vip', 'admin')
      then users.raw_app_meta_data ->> 'role'
    else 'user'
  end,
  case when users.banned_until is not null and users.banned_until > now() then 'suspended' else 'active' end,
  users.created_at
from auth.users as users
on conflict (id) do update
set role = excluded.role,
    status = excluded.status;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
      and profiles.status = 'active'
  );
$$;

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.status = 'active'
  );
$$;

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  movie_slug text not null check (char_length(movie_slug) between 1 and 200),
  movie_title text not null check (char_length(movie_title) between 1 and 200),
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 10),
  content text not null check (char_length(content) between 5 and 2000),
  has_spoiler boolean not null default false,
  likes_count integer not null default 0 check (likes_count >= 0),
  status text not null default 'approved' check (status in ('approved', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (movie_slug, user_id)
);

create table if not exists public.review_replies (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 2 and 1000),
  likes_count integer not null default 0 check (likes_count >= 0),
  status text not null default 'approved' check (status in ('approved', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.review_likes (
  review_id uuid not null references public.reviews(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (review_id, user_id)
);

create table if not exists public.review_reply_likes (
  reply_id uuid not null references public.review_replies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (reply_id, user_id)
);

create index if not exists reviews_movie_status_created_idx
  on public.reviews (movie_slug, status, created_at desc);
create index if not exists reviews_user_idx on public.reviews (user_id);
create index if not exists review_replies_review_created_idx
  on public.review_replies (review_id, status, created_at);
create index if not exists review_replies_user_idx on public.review_replies (user_id);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists reviews_set_updated_at on public.reviews;
create trigger reviews_set_updated_at
before update on public.reviews
for each row execute function public.set_updated_at();

drop trigger if exists review_replies_set_updated_at on public.review_replies;
create trigger review_replies_set_updated_at
before update on public.review_replies
for each row execute function public.set_updated_at();

create or replace function public.sync_review_like_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.reviews set likes_count = likes_count + 1 where id = new.review_id;
    return new;
  end if;

  update public.reviews set likes_count = greatest(likes_count - 1, 0) where id = old.review_id;
  return old;
end;
$$;

drop trigger if exists review_likes_sync_count on public.review_likes;
create trigger review_likes_sync_count
after insert or delete on public.review_likes
for each row execute function public.sync_review_like_count();

create or replace function public.sync_review_reply_like_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.review_replies set likes_count = likes_count + 1 where id = new.reply_id;
    return new;
  end if;

  update public.review_replies set likes_count = greatest(likes_count - 1, 0) where id = old.reply_id;
  return old;
end;
$$;

drop trigger if exists review_reply_likes_sync_count on public.review_reply_likes;
create trigger review_reply_likes_sync_count
after insert or delete on public.review_reply_likes
for each row execute function public.sync_review_reply_like_count();

alter table public.profiles enable row level security;
alter table public.reviews enable row level security;
alter table public.review_replies enable row level security;
alter table public.review_likes enable row level security;
alter table public.review_reply_likes enable row level security;

revoke all on public.profiles from anon, authenticated;
revoke all on public.reviews from anon, authenticated;
revoke all on public.review_replies from anon, authenticated;
revoke all on public.review_likes from anon, authenticated;
revoke all on public.review_reply_likes from anon, authenticated;

grant select on public.profiles to anon, authenticated;
grant update (display_name, avatar_url) on public.profiles to authenticated;
grant select on public.reviews, public.review_replies to anon, authenticated;
grant insert (movie_slug, movie_title, user_id, rating, content, has_spoiler) on public.reviews to authenticated;
grant update (rating, content, has_spoiler) on public.reviews to authenticated;
grant delete on public.reviews to authenticated;
grant insert (review_id, user_id, content) on public.review_replies to authenticated;
grant delete on public.review_replies to authenticated;
grant select, insert, delete on public.review_likes, public.review_reply_likes to authenticated;

drop policy if exists "Profiles are visible safely" on public.profiles;
create policy "Profiles are visible safely"
on public.profiles for select
to anon, authenticated
using (status = 'active' or id = auth.uid() or (select public.is_admin()));

drop policy if exists "Users update their profile" on public.profiles;
create policy "Users update their profile"
on public.profiles for update
to authenticated
using (id = auth.uid() and status = 'active')
with check (id = auth.uid() and status = 'active');

drop policy if exists "Reviews are visible safely" on public.reviews;
create policy "Reviews are visible safely"
on public.reviews for select
to anon, authenticated
using (status = 'approved' or user_id = auth.uid() or (select public.is_admin()));

drop policy if exists "Active users create reviews" on public.reviews;
create policy "Active users create reviews"
on public.reviews for insert
to authenticated
with check (
  user_id = auth.uid()
  and status = 'approved'
  and likes_count = 0
  and (select public.is_active_user())
);

drop policy if exists "Users update their reviews" on public.reviews;
create policy "Users update their reviews"
on public.reviews for update
to authenticated
using (user_id = auth.uid() and (select public.is_active_user()))
with check (user_id = auth.uid() and (select public.is_active_user()));

drop policy if exists "Owners and admins delete reviews" on public.reviews;
create policy "Owners and admins delete reviews"
on public.reviews for delete
to authenticated
using (user_id = auth.uid() or (select public.is_admin()));

drop policy if exists "Replies are visible safely" on public.review_replies;
create policy "Replies are visible safely"
on public.review_replies for select
to anon, authenticated
using (
  user_id = auth.uid()
  or (select public.is_admin())
  or (
    status = 'approved'
    and exists (
      select 1 from public.reviews
      where reviews.id = review_replies.review_id
        and reviews.status = 'approved'
    )
  )
);

drop policy if exists "Active users create replies" on public.review_replies;
create policy "Active users create replies"
on public.review_replies for insert
to authenticated
with check (
  user_id = auth.uid()
  and status = 'approved'
  and likes_count = 0
  and (select public.is_active_user())
  and exists (
    select 1 from public.reviews
    where reviews.id = review_replies.review_id
      and reviews.status = 'approved'
  )
);

drop policy if exists "Owners and admins delete replies" on public.review_replies;
create policy "Owners and admins delete replies"
on public.review_replies for delete
to authenticated
using (user_id = auth.uid() or (select public.is_admin()));

drop policy if exists "Users read their review likes" on public.review_likes;
create policy "Users read their review likes"
on public.review_likes for select
to authenticated
using (user_id = auth.uid() or (select public.is_admin()));

drop policy if exists "Active users like reviews" on public.review_likes;
create policy "Active users like reviews"
on public.review_likes for insert
to authenticated
with check (user_id = auth.uid() and (select public.is_active_user()));

drop policy if exists "Users remove their review likes" on public.review_likes;
create policy "Users remove their review likes"
on public.review_likes for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users read their reply likes" on public.review_reply_likes;
create policy "Users read their reply likes"
on public.review_reply_likes for select
to authenticated
using (user_id = auth.uid() or (select public.is_admin()));

drop policy if exists "Active users like replies" on public.review_reply_likes;
create policy "Active users like replies"
on public.review_reply_likes for insert
to authenticated
with check (user_id = auth.uid() and (select public.is_active_user()));

drop policy if exists "Users remove their reply likes" on public.review_reply_likes;
create policy "Users remove their reply likes"
on public.review_reply_likes for delete
to authenticated
using (user_id = auth.uid());

create or replace function public.admin_list_users()
returns table (
  id uuid,
  email text,
  display_name text,
  avatar_url text,
  role text,
  status text,
  created_at timestamptz,
  last_active_at timestamptz,
  reviews_count bigint,
  watchlist_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  return query
  select
    users.id,
    coalesce(users.email, ''),
    profiles.display_name,
    profiles.avatar_url,
    profiles.role,
    profiles.status,
    profiles.created_at,
    coalesce(users.last_sign_in_at, profiles.created_at),
    count(reviews.id)::bigint,
    0::bigint
  from auth.users as users
  join public.profiles as profiles on profiles.id = users.id
  left join public.reviews as reviews on reviews.user_id = users.id
  group by users.id, users.email, users.last_sign_in_at,
    profiles.display_name, profiles.avatar_url, profiles.role,
    profiles.status, profiles.created_at
  order by profiles.created_at desc;
end;
$$;

create or replace function public.admin_update_user(
  target_user_id uuid,
  new_role text,
  new_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  if new_role not in ('user', 'vip', 'admin') then
    raise exception 'Invalid role' using errcode = '22023';
  end if;
  if new_status not in ('active', 'suspended') then
    raise exception 'Invalid status' using errcode = '22023';
  end if;
  if target_user_id = auth.uid() and (new_role <> 'admin' or new_status <> 'active') then
    raise exception 'You cannot remove your own active admin access' using errcode = '42501';
  end if;

  update public.profiles
  set role = new_role, status = new_status
  where id = target_user_id;

  if not found then
    raise exception 'User not found' using errcode = 'P0002';
  end if;

  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', new_role),
      banned_until = case
        when new_status = 'suspended' then now() + interval '100 years'
        else null
      end,
      updated_at = now()
  where id = target_user_id;
end;
$$;

create or replace function public.admin_delete_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  if target_user_id = auth.uid() then
    raise exception 'You cannot delete your own account' using errcode = '42501';
  end if;

  delete from auth.users where id = target_user_id;
  if not found then
    raise exception 'User not found' using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.admin_set_review_status(
  target_review_id uuid,
  new_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  if new_status not in ('approved', 'hidden') then
    raise exception 'Invalid review status' using errcode = '22023';
  end if;

  update public.reviews set status = new_status where id = target_review_id;
  if not found then
    raise exception 'Review not found' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.sync_review_like_count() from public, anon, authenticated;
revoke all on function public.sync_review_reply_like_count() from public, anon, authenticated;
revoke all on function public.admin_list_users() from public, anon, authenticated;
revoke all on function public.admin_update_user(uuid, text, text) from public, anon, authenticated;
revoke all on function public.admin_delete_user(uuid) from public, anon, authenticated;
revoke all on function public.admin_set_review_status(uuid, text) from public, anon, authenticated;

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_active_user() to authenticated;
grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_update_user(uuid, text, text) to authenticated;
grant execute on function public.admin_delete_user(uuid) to authenticated;
grant execute on function public.admin_set_review_status(uuid, text) to authenticated;
