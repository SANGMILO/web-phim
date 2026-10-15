alter table public.movie_sources
  add column if not exists label text not null default 'Google Drive',
  add column if not exists scope text not null default 'movie',
  add column if not exists status text not null default 'active',
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'movie_sources_status_check'
      and conrelid = 'public.movie_sources'::regclass
  ) then
    alter table public.movie_sources
      add constraint movie_sources_status_check
      check (status in ('active', 'inactive'));
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'movie_sources_scope_check'
      and conrelid = 'public.movie_sources'::regclass
  ) then
    alter table public.movie_sources
      add constraint movie_sources_scope_check
      check (scope in ('movie', 'episode'));
  end if;
end;
$$;

create table if not exists public.movie_episodes (
  id uuid primary key default gen_random_uuid(),
  movie_id uuid not null references public.movies(id) on delete cascade,
  season_number integer not null default 1 check (season_number > 0),
  episode_number integer not null check (episode_number > 0),
  title text not null check (char_length(title) between 1 and 200),
  description text not null default '',
  thumbnail_url text not null default '',
  runtime integer check (runtime is null or runtime > 0),
  source_id uuid references public.movie_sources(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (movie_id, season_number, episode_number)
);

create index if not exists movie_sources_public_idx
  on public.movie_sources (movie_id, status, display_order);
create index if not exists movie_episodes_movie_order_idx
  on public.movie_episodes (movie_id, season_number, episode_number);
create index if not exists movie_episodes_source_idx
  on public.movie_episodes (source_id);

drop trigger if exists movie_sources_set_updated_at on public.movie_sources;
create trigger movie_sources_set_updated_at
before update on public.movie_sources
for each row execute function public.set_updated_at();

drop trigger if exists movie_episodes_set_updated_at on public.movie_episodes;
create trigger movie_episodes_set_updated_at
before update on public.movie_episodes
for each row execute function public.set_updated_at();

alter table public.movie_episodes enable row level security;

grant select on public.movie_sources to anon, authenticated;
revoke all on public.movie_episodes from anon, authenticated;
grant select on public.movie_episodes to anon, authenticated;
grant insert, update, delete on public.movie_episodes to authenticated;

drop policy if exists "Published movie sources are public" on public.movie_sources;
create policy "Published movie sources are public"
on public.movie_sources for select
to anon, authenticated
using (
  status = 'active'
  and exists (
    select 1 from public.movies
    where movies.id = movie_sources.movie_id
      and movies.status = 'published'
  )
  and (
    scope = 'movie'
    or exists (
      select 1 from public.movie_episodes
      where movie_episodes.source_id = movie_sources.id
        and movie_episodes.status = 'published'
    )
  )
);

drop policy if exists "Published episodes are public" on public.movie_episodes;
create policy "Published episodes are public"
on public.movie_episodes for select
to anon, authenticated
using (
  status = 'published'
  and exists (
    select 1 from public.movies
    where movies.id = movie_episodes.movie_id
      and movies.status = 'published'
  )
);

drop policy if exists "Admins can read movie episodes" on public.movie_episodes;
create policy "Admins can read movie episodes"
on public.movie_episodes for select
to authenticated
using ((select public.is_admin()));

drop policy if exists "Admins can insert movie episodes" on public.movie_episodes;
create policy "Admins can insert movie episodes"
on public.movie_episodes for insert
to authenticated
with check ((select public.is_admin()));

drop policy if exists "Admins can update movie episodes" on public.movie_episodes;
create policy "Admins can update movie episodes"
on public.movie_episodes for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Admins can delete movie episodes" on public.movie_episodes;
create policy "Admins can delete movie episodes"
on public.movie_episodes for delete
to authenticated
using ((select public.is_admin()));
