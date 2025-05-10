-- users 테이블
create table users (
  id uuid primary key default uuid_generate_v4(),
  clerk_id text unique not null,
  email text unique not null,
  name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- groups 테이블
create table groups (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  created_by uuid references users(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- group_members 테이블
create table group_members (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  role text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(group_id, user_id)
);

-- challenges 테이블
create table challenges (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references groups(id) on delete cascade,
  title text not null,
  description text,
  created_by uuid references users(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- challenge_progress 테이블
create table challenge_progress (
  id uuid primary key default uuid_generate_v4(),
  challenge_id uuid references challenges(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  progress numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(challenge_id, user_id)
);

-- posts 테이블
create table posts (
  id uuid primary key default uuid_generate_v4(),
  challenge_id uuid references challenges(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  group_id uuid references groups(id) on delete cascade,
  title text not null,
  content text not null,
  image_urls text[] default '{}',
  like_count integer default 0,
  comment_count integer default 0,
  is_deleted boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- post_likes 테이블
create table post_likes (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(post_id, user_id)
);

-- post_comments 테이블
create table post_comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  parent_id uuid references post_comments(id) on delete cascade,
  content text not null,
  is_deleted boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- users 테이블
alter table users enable row level security;
create policy "Users can view their own data" on users
  for select using (clerk_id = auth.uid()::text);
create policy "Users can update their own data" on users
  for update using (clerk_id = auth.uid()::text);

-- groups 테이블
alter table groups enable row level security;
create policy "Group members can view groups" on groups
  for select using (
    exists (
      select 1 from group_members
      where group_members.group_id = groups.id
      and group_members.user_id = auth.uid()::uuid
    )
  );
create policy "Group admins can update groups" on groups
  for update using (
    exists (
      select 1 from group_members
      where group_members.group_id = groups.id
      and group_members.user_id = auth.uid()::uuid
      and group_members.role = 'admin'
    )
  );

-- group_members 테이블
alter table group_members enable row level security;
create policy "Group members can view members" on group_members
  for select using (
    exists (
      select 1 from group_members gm
      where gm.group_id = group_members.group_id
      and gm.user_id = auth.uid()::uuid
    )
  );
create policy "Group admins can manage members" on group_members
  for all using (
    exists (
      select 1 from group_members gm
      where gm.group_id = group_members.group_id
      and gm.user_id = auth.uid()::uuid
      and gm.role = 'admin'
    )
  );

-- challenges 테이블
alter table challenges enable row level security;
create policy "Group members can view challenges" on challenges
  for select using (
    exists (
      select 1 from group_members
      where group_members.group_id = challenges.group_id
      and group_members.user_id = auth.uid()::uuid
    )
  );
create policy "Group admins can manage challenges" on challenges
  for all using (
    exists (
      select 1 from group_members
      where group_members.group_id = challenges.group_id
      and group_members.user_id = auth.uid()::uuid
      and group_members.role = 'admin'
    )
  );

-- challenge_progress 테이블
alter table challenge_progress enable row level security;
create policy "Users can view their own progress" on challenge_progress
  for select using (user_id = auth.uid()::uuid);
create policy "Users can update their own progress" on challenge_progress
  for all using (user_id = auth.uid()::uuid);

-- posts 테이블
alter table posts enable row level security;
create policy "Group members can view posts" on posts
  for select using (
    exists (
      select 1 from challenges c
      join group_members gm on gm.group_id = c.group_id
      where c.id = posts.challenge_id
      and gm.user_id = auth.uid()::uuid
    )
  );
create policy "Users can manage their own posts" on posts
  for all using (user_id = auth.uid()::uuid);

-- post_likes 테이블
alter table post_likes enable row level security;
create policy "Users can view likes" on post_likes
  for select using (true);
create policy "Users can manage their own likes" on post_likes
  for all using (user_id = auth.uid()::uuid);

-- post_comments 테이블
alter table post_comments enable row level security;
create policy "Users can view comments" on post_comments
  for select using (true);
create policy "Users can manage their own comments" on post_comments
  for all using (user_id = auth.uid()::uuid);

CREATE OR REPLACE FUNCTION increment_like_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER like_added
AFTER INSERT ON post_likes
FOR EACH ROW EXECUTE FUNCTION increment_like_count();

CREATE OR REPLACE FUNCTION decrement_like_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET like_count = like_count - 1 WHERE id = OLD.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER like_removed
AFTER DELETE ON post_likes
FOR EACH ROW EXECUTE FUNCTION decrement_like_count();

CREATE OR REPLACE FUNCTION increment_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comment_added
AFTER INSERT ON post_comments
FOR EACH ROW EXECUTE FUNCTION increment_comment_count();

CREATE OR REPLACE FUNCTION decrement_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comment_removed
AFTER DELETE ON post_comments
FOR EACH ROW EXECUTE FUNCTION decrement_comment_count();

CREATE TRIGGER comment_soft_delete
AFTER UPDATE OF is_deleted ON post_comments
FOR EACH ROW
EXECUTE FUNCTION decrement_comment_count();