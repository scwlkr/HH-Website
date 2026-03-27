create extension if not exists pgcrypto;

create table if not exists public.inquiry_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  name text not null,
  phone text not null,
  email text not null,
  preferred_contact_method text not null,
  project_type text not null,
  finish_level text not null,
  services_needed text[] not null default '{}',
  approx_square_footage integer not null,
  project_location text not null,
  lot_status text not null,
  timeline text not null,
  budget_range text,
  project_description text not null,
  source_page text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  status text not null default 'new'
);

create index if not exists inquiry_submissions_created_at_idx
  on public.inquiry_submissions (created_at desc);

create index if not exists inquiry_submissions_status_idx
  on public.inquiry_submissions (status);

alter table public.inquiry_submissions enable row level security;
