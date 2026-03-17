-- Final fix for notify_new_message trigger
-- The issue is text = uuid comparisons in JOIN/WHERE clauses
-- This version casts ALL comparisons explicitly

DROP FUNCTION IF EXISTS notify_new_message() CASCADE;

CREATE FUNCTION notify_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_conv_id_text TEXT;
    v_sender_id_text TEXT;
    v_recipient_id UUID;
    v_sender_name TEXT;
    v_app_id UUID;
    v_worker_id UUID;
    v_job_company_id UUID;
BEGIN
    -- Keep as text since Message columns are TEXT
    v_conv_id_text := NEW.conversationid;
    v_sender_id_text := NEW.senderid;

    -- Get the application linked to this conversation
    -- Conversation.id is UUID, so cast text to uuid for comparison
    SELECT c.application_uuid INTO v_app_id
    FROM "Conversation" c
    WHERE c.id = v_conv_id_text::uuid;

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

    -- Determine recipient: compare sender text with worker uuid via text cast
    IF v_sender_id_text = v_worker_id::text THEN
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
    WHERE u.id = v_sender_id_text::uuid;

    -- Insert notification
    INSERT INTO notifications (user_id, type, title, message, link, read_at, created_at)
    VALUES (
        v_recipient_id,
        'message',
        'Nova mensagem de ' || COALESCE(v_sender_name, 'Usuario'),
        LEFT(NEW.content, 100),
        '/messages?conversation=' || v_conv_id_text,
        NULL,
        NOW()
    )
    ON CONFLICT DO NOTHING;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Never block message insertion due to notification errors
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_new_message
    AFTER INSERT ON "Message"
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_message();
