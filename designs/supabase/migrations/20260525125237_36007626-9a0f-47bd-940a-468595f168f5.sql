
-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text unique,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles are viewable by everyone"
  on public.profiles for select using (true);
create policy "users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);
create policy "users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- roles
create type public.app_role as enum ('admin','moderator','user');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique(user_id, role)
);
alter table public.user_roles enable row level security;
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
create policy "user_roles viewable by self or admins"
  on public.user_roles for select
  using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));

-- handle new user trigger
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, handle)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)),
    split_part(new.email,'@',1)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- asset packs
create table public.asset_packs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  category text not null default 'mixed',
  tags text[] not null default '{}',
  cover_url text,
  pack_type text not null default 'assets' check (pack_type in ('assets','template','list')),
  is_public boolean not null default true,
  item_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.asset_packs enable row level security;
create policy "public packs are viewable by everyone"
  on public.asset_packs for select using (is_public = true or auth.uid() = owner_id);
create policy "owner can insert packs"
  on public.asset_packs for insert with check (auth.uid() = owner_id);
create policy "owner can update own packs"
  on public.asset_packs for update using (auth.uid() = owner_id);
create policy "owner can delete own packs"
  on public.asset_packs for delete using (auth.uid() = owner_id);

create index asset_packs_tags_idx on public.asset_packs using gin(tags);
create index asset_packs_category_idx on public.asset_packs(category);
create index asset_packs_type_idx on public.asset_packs(pack_type);

-- asset pack items
create table public.asset_pack_items (
  id uuid primary key default gen_random_uuid(),
  pack_id uuid not null references public.asset_packs(id) on delete cascade,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  position int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.asset_pack_items enable row level security;
create policy "items follow pack visibility"
  on public.asset_pack_items for select
  using (exists (select 1 from public.asset_packs p where p.id = pack_id and (p.is_public or p.owner_id = auth.uid())));
create policy "owner manages items"
  on public.asset_pack_items for all
  using (exists (select 1 from public.asset_packs p where p.id = pack_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.asset_packs p where p.id = pack_id and p.owner_id = auth.uid()));
