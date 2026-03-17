-- Migration: Add RLS policies for Message table with proper type casts
-- Previous migration applied the trigger fix but RLS policies failed due to type mismatches

-- Enable RLS on Message table (idempotent)
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;

-- Drop policies if they somehow partially exist
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON "Message";
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON "Message";

-- Users can view messages in conversations they're part of
-- Use explicit text casts to avoid uuid = text mismatch
CREATE POLICY "Users can view messages in their conversations" ON "Message"
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "Conversation" c
            JOIN applications a ON a.id::text = c.application_uuid::text
            WHERE c.id::text = conversationid
            AND (
                a.worker_id = auth.uid()
                OR a.job_id IN (SELECT j.id FROM jobs j WHERE j.company_id = auth.uid())
            )
        )
    );

-- Users can insert messages in conversations they're part of
CREATE POLICY "Users can insert messages in their conversations" ON "Message"
    FOR INSERT TO authenticated
    WITH CHECK (
        senderid = auth.uid()::text
        AND EXISTS (
            SELECT 1 FROM "Conversation" c
            JOIN applications a ON a.id::text = c.application_uuid::text
            WHERE c.id::text = conversationid
            AND (
                a.worker_id = auth.uid()
                OR a.job_id IN (SELECT j.id FROM jobs j WHERE j.company_id = auth.uid())
            )
        )
    );
