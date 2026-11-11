create extension if not exists pgcrypto;

-- Supabase Auth owns authentication. This table stores teacher profile data.
create table public.teachers (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  type text not null check (type in (
    'multiple_choice',
    'true_false',
    'flashcards',
    'matching',
    'ordering'
  )),
  content jsonb not null,
  prompt text not null default '',
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Creates the matching teacher profile whenever Supabase Auth creates a user.
create or replace function public.handle_new_teacher()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.teachers (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_teacher();

create index activities_teacher_id_updated_at_idx
  on public.activities (teacher_id, updated_at desc);

alter table public.teachers enable row level security;
alter table public.activities enable row level security;

create policy "teachers can read their own profile"
  on public.teachers for select
  using (auth.uid() = id);

create policy "teachers can create their own profile"
  on public.teachers for insert
  with check (auth.uid() = id);

create policy "teachers can update their own profile"
  on public.teachers for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "teachers can read their own activities"
  on public.activities for select
  using (auth.uid() = teacher_id);

create policy "teachers can create their own activities"
  on public.activities for insert
  with check (auth.uid() = teacher_id);

create policy "teachers can update their own activities"
  on public.activities for update
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

create policy "teachers can delete their own activities"
  on public.activities for delete
  using (auth.uid() = teacher_id);

-- Public student pages may read only published activities. They do not need auth.
create policy "anyone can read published activities"
  on public.activities for select
  to anon, authenticated
  using (is_published = true);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger teachers_set_updated_at
before update on public.teachers
for each row execute function public.set_updated_at();

create trigger activities_set_updated_at
before update on public.activities
for each row execute function public.set_updated_at();
