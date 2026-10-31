-- Tables
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text,
  created_at timestamptz not null default now()
);

create table public.videos (
  id text primary key,
  title text not null,
  channel_name text,
  fetched_at timestamptz not null default now()
);

create table public.logs (
  user_id uuid not null references public.profiles(id) on delete cascade,
  video_id text not null references public.videos(id),
  rating smallint not null check (rating between 1 and 5),
  review text not null default '',
  logged_at timestamptz not null default now(),
  primary key (user_id, video_id)
);

create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

-- Create a profile automatically for each new sign-up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  wanted text := lower(coalesce(new.raw_user_meta_data ->> 'username', ''));
  fallback text := 'user_' || substr(replace(new.id::text, '-', ''), 1, 10);
begin
  if wanted !~ '^[a-z0-9_]{3,20}$'
     or exists (select 1 from public.profiles where username = wanted) then
    wanted := fallback;
  end if;

  begin
    insert into public.profiles (id, username) values (new.id, wanted);
  exception when unique_violation then
    insert into public.profiles (id, username) values (new.id, fallback);
  end;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.videos enable row level security;
alter table public.logs enable row level security;
alter table public.follows enable row level security;

create policy "profiles are public"
  on public.profiles for select using (true);
create policy "users update own profile"
  on public.profiles for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "anyone can read videos"
  on public.videos for select using (true);

create policy "logs are public"
  on public.logs for select using (true);
create policy "users insert own logs"
  on public.logs for insert with check ((select auth.uid()) = user_id);
create policy "users update own logs"
  on public.logs for update using ((select auth.uid()) = user_id);
create policy "users delete own logs"
  on public.logs for delete using ((select auth.uid()) = user_id);

create policy "follows are public"
  on public.follows for select using (true);
create policy "users follow as themselves"
  on public.follows for insert
  with check ((select auth.uid()) = follower_id);
create policy "users unfollow as themselves"
  on public.follows for delete
  using ((select auth.uid()) = follower_id);

-- Grants (tables aren't exposed to the API until granted)
grant select on public.profiles to anon, authenticated;
grant update (username, display_name) on public.profiles to authenticated;
grant all on public.profiles to service_role;

grant select on public.videos to anon, authenticated;
grant all on public.videos to service_role;

grant select on public.logs to anon, authenticated;
grant insert, update, delete on public.logs to authenticated;
grant all on public.logs to service_role;

grant select on public.follows to anon, authenticated;
grant insert, delete on public.follows to authenticated;
grant all on public.follows to service_role;