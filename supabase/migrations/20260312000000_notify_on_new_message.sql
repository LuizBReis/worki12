-- Migration: Criar notificação de nova mensagem via trigger
-- File: supabase/migrations/20260312000000_notify_on_new_message.sql

-- Função que insere notificação para o destinatário de uma nova mensagem
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_conversation_id UUID;
    v_recipient_id UUID;
    v_sender_name TEXT;
    v_app_id UUID;
    v_worker_id UUID;
    v_job_company_id UUID;
BEGIN
    v_conversation_id := NEW.conversationid;

    -- Get the application linked to this conversation
    SELECT c.application_uuid INTO v_app_id
    FROM "Conversation" c
    WHERE c.id = v_conversation_id;

    IF v_app_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Get worker_id and job's company_id from the application
    SELECT a.worker_id, j.company_id INTO v_worker_id, v_job_company_id
    FROM applications a
    JOIN jobs j ON j.id = a.job_id
    WHERE a.id = v_app_id;

    -- Determine recipient: if sender is worker -> recipient is company; if sender is company -> recipient is worker
    IF NEW.senderid = v_worker_id THEN
        v_recipient_id := v_job_company_id;
    ELSE
        v_recipient_id := v_worker_id;
    END IF;

    -- Get sender name for notification message
    SELECT COALESCE(w.full_name, comp.name, 'Usuário')
    INTO v_sender_name
    FROM auth.users u
    LEFT JOIN workers w ON w.id = u.id
    LEFT JOIN companies comp ON comp.id = u.id
    WHERE u.id = NEW.senderid;

    -- Insert in-app notification for the recipient
    INSERT INTO notifications (user_id, type, title, message, link, read_at, created_at)
    VALUES (
        v_recipient_id,
        'message',
        'Nova mensagem de ' || COALESCE(v_sender_name, 'Usuário'),
        LEFT(NEW.content, 100),
        '/messages?conversation=' || v_conversation_id::text,
        NULL,
        NOW()
    )
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$;

-- Trigger: fires AFTER each new message inserted
DROP TRIGGER IF EXISTS trg_notify_new_message ON "Message";
CREATE TRIGGER trg_notify_new_message
    AFTER INSERT ON "Message"
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_message();
