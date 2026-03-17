-- Migration: Habilitar RLS na tabela Message
-- Risk: LOW
-- Backup required: NO
--
-- DOWN (rollback):
-- DROP POLICY IF EXISTS "Participants can view messages" ON "Message";
-- DROP POLICY IF EXISTS "Participants can insert messages" ON "Message";
-- ALTER TABLE "Message" DISABLE ROW LEVEL SECURITY;

-- UP (apply):
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;

-- SELECT: participantes da conversa podem ver mensagens
CREATE POLICY "Participants can view messages" ON "Message"
    FOR SELECT TO authenticated
    USING (
        conversation_id IN (
            SELECT id FROM "Conversation"
            WHERE application_uuid IN (
                SELECT id FROM applications
                WHERE worker_id = auth.uid()
                   OR job_id IN (SELECT id FROM jobs WHERE company_id = auth.uid())
            )
        )
    );

-- INSERT: participantes da conversa podem enviar mensagens
CREATE POLICY "Participants can insert messages" ON "Message"
    FOR INSERT TO authenticated
    WITH CHECK (
        conversation_id IN (
            SELECT id FROM "Conversation"
            WHERE application_uuid IN (
                SELECT id FROM applications
                WHERE worker_id = auth.uid()
                   OR job_id IN (SELECT id FROM jobs WHERE company_id = auth.uid())
            )
        )
    );
