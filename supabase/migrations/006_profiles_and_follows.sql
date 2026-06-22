-- Public user profiles (bio, denormalised username/avatar for search)
create table if not exists user_profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  username   text not null default '',
  bio        text not null default '',
  avatar_url text,
  updated_at timestamptz not null default now()
);

-- Follow graph
create table if not exists follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  followed_id uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followed_id),
  check (follower_id <> followed_id)
);

alter table user_profiles enable row level security;
alter table follows       enable row level security;

create policy "Anyone can view user profiles"
  on user_profiles for select using (true);

create policy "Users can upsert own profile"
  on user_profiles for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Anyone can view follows"
  on follows for select using (true);

create policy "Users can manage own follows"
  on follows for all
  using  (auth.uid() = follower_id)
  with check (auth.uid() = follower_id);
