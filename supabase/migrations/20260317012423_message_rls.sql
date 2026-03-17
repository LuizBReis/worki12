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

-- Drop policies antigas caso existam (evitar conflito)
DROP POLICY IF EXISTS "Participants can view messages" ON "Message";
DROP POLICY IF EXISTS "Participants can insert messages" ON "Message";

-- SELECT: participantes da conversa podem ver mensagens
-- Nota: Message usa "conversationid" (sem underscore, Prisma schema)
CREATE POLICY "Participants can view messages" ON "Message"
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

-- INSERT: participantes da conversa podem enviar mensagens
CREATE POLICY "Participants can insert messages" ON "Message"
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
