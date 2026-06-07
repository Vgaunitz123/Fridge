-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Fridge items
create table if not exists fridge_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  quantity numeric not null default 1,
  unit text not null default 'st',
  expiry_date date,
  category text not null default 'other',
  created_at timestamptz not null default now()
);

-- Recipes (AI-generated or user-submitted)
create table if not exists recipes (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  ingredients jsonb not null default '[]',
  steps jsonb not null default '[]',
  image_url text,
  cook_time_minutes integer not null default 30,
  tags text[] not null default '{}',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Social posts
create table if not exists social_posts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id uuid references recipes(id) on delete set null,
  image_url text,
  caption text not null default '',
  created_at timestamptz not null default now()
);

-- Post likes
create table if not exists post_likes (
  post_id uuid not null references social_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (post_id, user_id)
);

-- Row Level Security
alter table fridge_items enable row level security;
alter table recipes enable row level security;
alter table social_posts enable row level security;
alter table post_likes enable row level security;

-- fridge_items: users can only see and modify their own items
create policy "Users manage own fridge items"
  on fridge_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- recipes: users can read all, create their own
create policy "Anyone can read recipes"
  on recipes for select
  using (true);

create policy "Users create own recipes"
  on recipes for insert
  with check (auth.uid() = created_by);

create policy "Users delete own recipes"
  on recipes for delete
  using (auth.uid() = created_by);

-- social_posts: anyone reads, authors manage own
create policy "Anyone can read posts"
  on social_posts for select
  using (true);

create policy "Users create own posts"
  on social_posts for insert
  with check (auth.uid() = user_id);

create policy "Users delete own posts"
  on social_posts for delete
  using (auth.uid() = user_id);

-- post_likes: users manage their own likes
create policy "Users manage own likes"
  on post_likes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Indexes for performance
create index if not exists fridge_items_user_id_idx on fridge_items(user_id);
create index if not exists fridge_items_expiry_idx on fridge_items(expiry_date);
create index if not exists recipes_created_by_idx on recipes(created_by);
create index if not exists social_posts_created_at_idx on social_posts(created_at desc);
create index if not exists social_posts_user_id_idx on social_posts(user_id);
