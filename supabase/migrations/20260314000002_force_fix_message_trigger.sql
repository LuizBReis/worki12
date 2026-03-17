-- Force re-create the notify_new_message function
-- Drop the trigger first, then recreate both
DROP TRIGGER IF EXISTS trg_notify_new_message ON "Message";
DROP FUNCTION IF EXISTS notify_new_message();

CREATE FUNCTION notify_new_message()
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
    -- Cast text columns to UUID explicitly
    BEGIN
        v_conversation_id := NEW.conversationid::uuid;
        v_sender_uuid := NEW.senderid::uuid;
    EXCEPTION WHEN OTHERS THEN
        -- If cast fails, skip notification silently
        RETURN NEW;
    END;

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

    IF v_worker_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Determine recipient
    IF v_sender_uuid = v_worker_id THEN
        v_recipient_id := v_job_company_id;
    ELSE
        v_recipient_id := v_worker_id;
    END IF;

    IF v_recipient_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Get sender name
    SELECT COALESCE(w.full_name, comp.name, 'Usuario')
    INTO v_sender_name
    FROM auth.users u
    LEFT JOIN workers w ON w.id = u.id
    LEFT JOIN companies comp ON comp.id = u.id
    WHERE u.id = v_sender_uuid;

    -- Insert notification
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

CREATE TRIGGER trg_notify_new_message
    AFTER INSERT ON "Message"
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_message();
