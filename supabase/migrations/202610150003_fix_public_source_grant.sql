-- The first schema migration only granted movie_sources access to authenticated
-- users. Published playback is rendered server-side with the anon role, while
-- RLS still limits rows to active sources belonging to published content.
grant select on public.movie_sources to anon, authenticated;
