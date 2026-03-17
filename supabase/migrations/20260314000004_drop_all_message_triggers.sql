-- Drop ALL triggers on Message table to find the culprit
DROP TRIGGER IF EXISTS trg_notify_new_message ON "Message";
-- Check for any other triggers by listing what Prisma might have created
DROP TRIGGER IF EXISTS update_message_updated_at ON "Message";
DROP TRIGGER IF EXISTS message_insert_trigger ON "Message";
DROP TRIGGER IF EXISTS message_update_trigger ON "Message";
