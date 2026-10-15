create extension if not exists pgcrypto;

create table if not exists public.movies (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text not null default '',
  poster_url text not null default '',
  backdrop_url text not null default '',
  release_year integer not null check (release_year between 1888 and 2200),
  release_date date,
  content_type text not null check (content_type in ('movie', 'series', 'anime', 'theatrical')),
  genres text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published')),
  original_title text,
  runtime integer check (runtime is null or runtime > 0),
  rating numeric(3, 1) check (rating is null or rating between 0 and 10),
  trailer_url text,
  quality text,
  language text,
  country text,
  featured boolean not null default false,
  trending boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.movie_sources (
  id uuid primary key default gen_random_uuid(),
  movie_id uuid not null references public.movies(id) on delete cascade,
  provider text not null,
  external_file_id text not null,
  playback_mode text not null default 'preview',
  display_order integer not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now(),
  unique (movie_id, provider, external_file_id)
);

create index if not exists movies_status_idx on public.movies (status);
create index if not exists movies_content_type_idx on public.movies (content_type);
create index if not exists movies_release_year_idx on public.movies (release_year desc);
create index if not exists movies_genres_idx on public.movies using gin (genres);
create index if not exists movie_sources_movie_order_idx on public.movie_sources (movie_id, display_order);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists movies_set_updated_at on public.movies;
create trigger movies_set_updated_at
before update on public.movies
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

alter table public.movies enable row level security;
alter table public.movie_sources enable row level security;

revoke all on public.movies from anon, authenticated;
revoke all on public.movie_sources from anon, authenticated;
grant select on public.movies to anon, authenticated;
grant insert, update, delete on public.movies to authenticated;
grant select, insert, update, delete on public.movie_sources to authenticated;
grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists "Published movies are public" on public.movies;
create policy "Published movies are public"
on public.movies for select
to anon, authenticated
using (status = 'published' or (select public.is_admin()));

drop policy if exists "Admins can insert movies" on public.movies;
create policy "Admins can insert movies"
on public.movies for insert
to authenticated
with check ((select public.is_admin()));

drop policy if exists "Admins can update movies" on public.movies;
create policy "Admins can update movies"
on public.movies for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Admins can delete movies" on public.movies;
create policy "Admins can delete movies"
on public.movies for delete
to authenticated
using ((select public.is_admin()));

drop policy if exists "Admins can read movie sources" on public.movie_sources;
create policy "Admins can read movie sources"
on public.movie_sources for select
to authenticated
using ((select public.is_admin()));

drop policy if exists "Admins can insert movie sources" on public.movie_sources;
create policy "Admins can insert movie sources"
on public.movie_sources for insert
to authenticated
with check ((select public.is_admin()));

drop policy if exists "Admins can update movie sources" on public.movie_sources;
create policy "Admins can update movie sources"
on public.movie_sources for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Admins can delete movie sources" on public.movie_sources;
create policy "Admins can delete movie sources"
on public.movie_sources for delete
to authenticated
using ((select public.is_admin()));

