-- Short video feed (Inspiration)

create table if not exists videos (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references auth.users(id) on delete cascade,
  author_username  text        not null default '',
  video_url        text        not null,
  thumbnail_url    text,
  caption          text        not null default '',
  recipe_id        uuid        references recipes(id) on delete set null,
  created_at       timestamptz not null default now()
);

create table if not exists video_likes (
  video_id  uuid not null references videos(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  primary key (video_id, user_id)
);

alter table videos       enable row level security;
alter table video_likes  enable row level security;

create policy "Anyone can view videos"
  on videos for select using (true);

create policy "Users can insert own videos"
  on videos for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own videos"
  on videos for delete
  using (auth.uid() = user_id);

create policy "Anyone can view video likes"
  on video_likes for select using (true);

create policy "Users can manage own video likes"
  on video_likes for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
