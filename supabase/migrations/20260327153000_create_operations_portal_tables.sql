create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  status text not null check (status in ('for-sale', 'sold')),
  build_type_slug text not null,
  finish_level_slug text not null,
  square_footage integer not null check (square_footage > 0),
  bedrooms integer not null check (bedrooms > 0),
  bathrooms numeric(5, 1) not null check (bathrooms > 0),
  location text not null,
  short_description text not null,
  full_description text not null,
  featured boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists projects_created_at_idx
  on public.projects (created_at desc);

create index if not exists projects_featured_idx
  on public.projects (featured desc, created_at desc);

create table if not exists public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  storage_path text not null unique,
  alt_text text,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_cover boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists project_images_one_cover_per_project_idx
  on public.project_images (project_id)
  where is_cover;

create index if not exists project_images_project_sort_idx
  on public.project_images (project_id, sort_order asc);

create table if not exists public.pricing_settings (
  id integer primary key check (id = 1),
  builder_grade_price_per_sqft numeric(10, 2),
  builder_plus_price_per_sqft numeric(10, 2),
  custom_price_per_sqft numeric(10, 2),
  pricing_note text,
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.pricing_settings (
  id,
  builder_grade_price_per_sqft,
  builder_plus_price_per_sqft,
  custom_price_per_sqft,
  pricing_note
)
values (1, null, null, null, null)
on conflict (id) do nothing;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
before update on public.projects
for each row execute procedure public.set_updated_at();

drop trigger if exists pricing_settings_set_updated_at on public.pricing_settings;
create trigger pricing_settings_set_updated_at
before update on public.pricing_settings
for each row execute procedure public.set_updated_at();

alter table public.projects enable row level security;
alter table public.project_images enable row level security;
alter table public.pricing_settings enable row level security;

create policy "Public can read projects"
  on public.projects
  for select
  to anon, authenticated
  using (true);

create policy "Public can read project images"
  on public.project_images
  for select
  to anon, authenticated
  using (true);

create policy "Public can read pricing settings"
  on public.pricing_settings
  for select
  to anon, authenticated
  using (true);

insert into storage.buckets (id, name, public)
values ('project-images', 'project-images', true)
on conflict (id) do update
set public = excluded.public;

create policy "Public can read project image objects"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'project-images');
