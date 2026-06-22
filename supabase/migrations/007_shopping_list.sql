create table if not exists shopping_list (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  name       text        not null,
  quantity   numeric     not null default 1,
  unit       text        not null default 'st',
  recipe_id  text,        -- optional: UUID or "mealdb_XXX"
  checked    boolean     not null default false,
  created_at timestamptz not null default now()
);

alter table shopping_list enable row level security;

create policy "Users manage own shopping list"
  on shopping_list for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
