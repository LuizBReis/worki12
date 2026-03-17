-- Migration: Fix type mismatch in notify_new_message trigger
-- The Message table uses TEXT columns for senderid and conversationid
-- but the trigger compares them with UUID columns, causing:
--   "operator does not exist: text = uuid"

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
    v_sender_uuid UUID;
BEGIN
    -- Cast text to UUID
    v_conversation_id := NEW.conversationid::uuid;
    v_sender_uuid := NEW.senderid::uuid;

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

    -- Determine recipient: if sender is worker -> recipient is company; vice versa
    IF v_sender_uuid = v_worker_id THEN
        v_recipient_id := v_job_company_id;
    ELSE
        v_recipient_id := v_worker_id;
    END IF;

    -- Get sender name for notification message
    SELECT COALESCE(w.full_name, comp.name, 'Usuario')
    INTO v_sender_name
    FROM auth.users u
    LEFT JOIN workers w ON w.id = u.id
    LEFT JOIN companies comp ON comp.id = u.id
    WHERE u.id = v_sender_uuid;

    -- Insert in-app notification for the recipient
    INSERT INTO notifications (user_id, type, title, message, link, read_at, created_at)
    VALUES (
        v_recipient_id,
        'message',
        'Nova mensagem de ' || COALESCE(v_sender_name, 'Usuario'),
        LEFT(NEW.content, 100),
        '/messages?conversation=' || v_conversation_id::text,
        NULL,
        NOW()
    )
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$;
