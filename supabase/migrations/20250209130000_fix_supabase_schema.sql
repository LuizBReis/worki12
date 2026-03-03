-- Create notifications table
create table if not exists public.notifications (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('status_change', 'message', 'payment', 'system')),
  title text not null,
  message text not null,
  link text,
  read_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  primary key (id)
);

-- Enable RLS
alter table public.notifications enable row level security;

-- Create policies
drop policy if exists "Users can view their own notifications" on public.notifications;
create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "Users can update their own notifications (mark as read)" on public.notifications;
create policy "Users can update their own notifications (mark as read)"
  on public.notifications for update
  using (auth.uid() = user_id);

-- Create indexes
create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists notifications_read_at_idx on public.notifications(read_at) where read_at is null;

-- Add read_at column to Message table
-- "Message" table seems to be case-sensitive based on previous tools
alter table public."Message" add column if not exists read_at timestamp with time zone;
create index if not exists message_read_at_idx on public."Message"(read_at) where read_at is null;
