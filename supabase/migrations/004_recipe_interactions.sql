-- Recipe likes (recipe_id is TEXT to support both UUID and "mealdb_XXX" recipes)
create table if not exists recipe_likes (
  recipe_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (recipe_id, user_id)
);

alter table recipe_likes enable row level security;

create policy "Anyone can read recipe likes"
  on recipe_likes for select using (true);

create policy "Users manage own recipe likes"
  on recipe_likes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Recipe ratings (1–5 stars, one per user per recipe)
create table if not exists recipe_ratings (
  id uuid primary key default gen_random_uuid(),
  recipe_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  unique (recipe_id, user_id)
);

alter table recipe_ratings enable row level security;

create policy "Anyone can read recipe ratings"
  on recipe_ratings for select using (true);

create policy "Users manage own recipe ratings"
  on recipe_ratings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
