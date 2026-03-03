-- Add read_at column to messages table
alter table public.messages 
add column read_at timestamp with time zone;

-- Create index for performance on unread messages
create index messages_read_at_idx on public.messages(read_at) where read_at is null;
