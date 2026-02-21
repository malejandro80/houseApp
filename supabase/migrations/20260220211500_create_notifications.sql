-- create_notifications_table.sql

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR NOT NULL,
    message VARCHAR NOT NULL,
    type VARCHAR NOT NULL, -- 'lead', 'message', 'appointment'
    link_url VARCHAR,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- RLS Enable
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- No insert/delete policies since insertions are done by triggers (SECURITY DEFINER)
-- which bypass RLS. Users shouldn't insert notifications directly.

-- Trigger for New Leads
CREATE OR REPLACE FUNCTION notify_new_lead()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.advisor_id IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, title, message, type, link_url)
        VALUES (
            NEW.advisor_id,
            'Nuevo Lead Recibido',
            NEW.client_name || ' está interesado en una propiedad.',
            'lead',
            '/advisor/inbox?id=' || NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_lead ON public.leads;
CREATE TRIGGER on_new_lead
AFTER INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION notify_new_lead();


-- Trigger for New Messages
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
    v_lead_owner UUID;
    v_advisor_id UUID;
    v_recipient_id UUID;
    v_link_url TEXT;
BEGIN
    SELECT created_by, advisor_id INTO v_lead_owner, v_advisor_id
    FROM public.leads
    WHERE id = NEW.lead_id;

    -- Determine recipient
    IF NEW.sender_id = v_lead_owner THEN
        v_recipient_id := v_advisor_id;
        v_link_url := '/advisor/inbox?id=' || NEW.lead_id;
    ELSIF NEW.sender_id = v_advisor_id THEN
        v_recipient_id := v_lead_owner;
        v_link_url := '/my-properties/messages?id=' || NEW.lead_id;
    END IF;

    IF v_recipient_id IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, title, message, type, link_url)
        VALUES (
            v_recipient_id,
            'Nuevo Mensaje',
            'Tienes un nuevo mensaje en tu bandeja.',
            'message',
            v_link_url
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_message ON public.messages;
CREATE TRIGGER on_new_message
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION notify_new_message();


-- Trigger for Appointment Changes
CREATE OR REPLACE FUNCTION notify_appointment_change()
RETURNS TRIGGER AS $$
DECLARE
    v_client_id UUID;
    v_client_name TEXT;
    v_triggering_user UUID;
BEGIN
    IF NEW.lead_id IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT created_by, client_name INTO v_client_id, v_client_name
    FROM public.leads
    WHERE id = NEW.lead_id;

    v_triggering_user := auth.uid();

    IF TG_OP = 'INSERT' THEN
        -- Notify Client
        IF v_client_id IS NOT NULL AND (v_triggering_user IS NULL OR v_triggering_user != v_client_id) THEN
            INSERT INTO public.notifications (user_id, title, message, type, link_url)
            VALUES (v_client_id, 'Visita Agendada', 'Se ha agendado una nueva cita.', 'appointment', '/my-properties/messages?id=' || NEW.lead_id);
        END IF;
        -- Notify Advisor
        IF NEW.advisor_id IS NOT NULL AND (v_triggering_user IS NULL OR v_triggering_user != NEW.advisor_id) THEN
            INSERT INTO public.notifications (user_id, title, message, type, link_url)
            VALUES (NEW.advisor_id, 'Nueva Cita', 'Nueva cita agendada con ' || v_client_name, 'appointment', '/advisor/inbox?id=' || NEW.lead_id);
        END IF;
        
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.status = 'rescheduled' AND OLD.status = 'scheduled' THEN
            IF v_client_id IS NOT NULL AND (v_triggering_user IS NULL OR v_triggering_user != v_client_id) THEN
                INSERT INTO public.notifications (user_id, title, message, type, link_url)
                VALUES (v_client_id, 'Cita Reprogramada', 'Se ha reprogramado tu cita.', 'appointment', '/my-properties/messages?id=' || NEW.lead_id);
            END IF;
            IF NEW.advisor_id IS NOT NULL AND (v_triggering_user IS NULL OR v_triggering_user != NEW.advisor_id) THEN
                INSERT INTO public.notifications (user_id, title, message, type, link_url)
                VALUES (NEW.advisor_id, 'Cita Reprogramada', 'Se ha reprogramado una cita con ' || v_client_name, 'appointment', '/advisor/inbox?id=' || NEW.lead_id);
            END IF;
        END IF;

        IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
            IF v_client_id IS NOT NULL AND (v_triggering_user IS NULL OR v_triggering_user != v_client_id) THEN
                INSERT INTO public.notifications (user_id, title, message, type, link_url)
                VALUES (v_client_id, 'Cita Cancelada', 'Se ha cancelado tu cita.', 'appointment', '/my-properties/messages?id=' || NEW.lead_id);
            END IF;
            IF NEW.advisor_id IS NOT NULL AND (v_triggering_user IS NULL OR v_triggering_user != NEW.advisor_id) THEN
                INSERT INTO public.notifications (user_id, title, message, type, link_url)
                VALUES (NEW.advisor_id, 'Cita Cancelada', 'Se ha cancelado una cita con ' || v_client_name, 'appointment', '/advisor/inbox?id=' || NEW.lead_id);
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_appointment_change ON public.appointments;
CREATE TRIGGER on_appointment_change
AFTER INSERT OR UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION notify_appointment_change();

-- Enable replication on notifications for supabase realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
