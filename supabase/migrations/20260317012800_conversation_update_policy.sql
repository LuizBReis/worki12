-- Migration: Adicionar UPDATE policy para Conversation
-- Risk: LOW
-- Backup required: NO
--
-- DOWN (rollback):
-- DROP POLICY IF EXISTS "Participants can update conversations" ON "Conversation";

-- UP (apply):
CREATE POLICY "Participants can update conversations" ON "Conversation"
    FOR UPDATE TO authenticated
    USING (
        application_uuid IN (
            SELECT id FROM applications
            WHERE worker_id = auth.uid()
               OR job_id IN (SELECT id FROM jobs WHERE company_id = auth.uid())
        )
    )
    WITH CHECK (
        application_uuid IN (
            SELECT id FROM applications
            WHERE worker_id = auth.uid()
               OR job_id IN (SELECT id FROM jobs WHERE company_id = auth.uid())
        )
    );
