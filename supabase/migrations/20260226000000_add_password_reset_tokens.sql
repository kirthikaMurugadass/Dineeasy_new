-- Password reset tokens table for custom reset flow
create table if not exists public.password_reset_tokens (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_password_reset_tokens_user_id
  on public.password_reset_tokens (user_id);

create index if not exists idx_password_reset_tokens_token_hash
  on public.password_reset_tokens (token_hash);

alter table public.password_reset_tokens enable row level security;

