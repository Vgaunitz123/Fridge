-- Add tags and user_email to social_posts
alter table social_posts
  add column if not exists tags text[] not null default '{}',
  add column if not exists user_email text;
