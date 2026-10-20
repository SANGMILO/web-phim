-- Synchronize editable user profile fields with Auth and the admin dashboard.
-- Wallet/payment data is intentionally excluded until it has a server-verified ledger.

create table if not exists public.profile_details (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  phone text not null default '' check (char_length(phone) <= 30),
  bio text not null default '' check (char_length(bio) <= 500),
  favorite_genres text[] not null default '{}' check (cardinality(favorite_genres) <= 20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_avatar_length_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_avatar_length_check check (char_length(avatar_url) <= 500000);
  end if;
end;
$$;

drop trigger if exists profile_details_set_updated_at on public.profile_details;
create trigger profile_details_set_updated_at
before update on public.profile_details
for each row execute function public.set_updated_at();

create or replace function public.ensure_profile_details()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profile_details (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists profiles_create_details on public.profiles;
create trigger profiles_create_details
after insert on public.profiles
for each row execute function public.ensure_profile_details();

insert into public.profile_details (user_id)
select id from public.profiles
on conflict (user_id) do nothing;

alter table public.profile_details enable row level security;

revoke all on public.profile_details from anon, authenticated;
grant select on public.profile_details to authenticated;
grant insert (user_id, phone, bio, favorite_genres) on public.profile_details to authenticated;
grant update (phone, bio, favorite_genres) on public.profile_details to authenticated;

drop policy if exists "Users read own profile details" on public.profile_details;
create policy "Users read own profile details"
on public.profile_details for select
to authenticated
using (user_id = auth.uid() or (select public.is_admin()));

drop policy if exists "Active users insert own profile details" on public.profile_details;
create policy "Active users insert own profile details"
on public.profile_details for insert
to authenticated
with check (user_id = auth.uid() and (select public.is_active_user()));

drop policy if exists "Active users update own profile details" on public.profile_details;
create policy "Active users update own profile details"
on public.profile_details for update
to authenticated
using (user_id = auth.uid() and (select public.is_active_user()))
with check (user_id = auth.uid() and (select public.is_active_user()));

create or replace function public.sync_profile_auth_metadata()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update auth.users
  set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
    || jsonb_build_object(
      'display_name', new.display_name,
      'avatar_url', case
        when new.avatar_url like 'data:%' then ''
        else left(new.avatar_url, 2048)
      end
    ),
    updated_at = now()
  where id = new.id;

  return new;
end;
$$;

drop trigger if exists profiles_sync_auth_metadata on public.profiles;
create trigger profiles_sync_auth_metadata
after update of display_name, avatar_url on public.profiles
for each row execute function public.sync_profile_auth_metadata();

update auth.users as users
set raw_user_meta_data = coalesce(users.raw_user_meta_data, '{}'::jsonb)
  || jsonb_build_object(
    'display_name', profiles.display_name,
    'avatar_url', case
      when profiles.avatar_url like 'data:%' then ''
      else left(profiles.avatar_url, 2048)
    end
  ),
  updated_at = now()
from public.profiles as profiles
where profiles.id = users.id;

revoke all on function public.sync_profile_auth_metadata() from public, anon, authenticated;
revoke all on function public.ensure_profile_details() from public, anon, authenticated;
