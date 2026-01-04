CREATE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION check_duplicate_application() RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM adoption_application
        WHERE animal_id = NEW.animal_id
          AND candidate_id = NEW.candidate_id
          AND status IN ('submitted', 'under_review', 'approved')
    ) THEN
        RAISE EXCEPTION 'Active application for this animal already exists';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION check_volunteer_availability() RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM shift s
        JOIN shift_volunteer sv ON s.shift_id = sv.shift_id
        WHERE sv.volunteer_id = NEW.volunteer_id
          AND sv.attendance_status <> 'absent'
          AND s.shift_date = (SELECT shift_date FROM shift WHERE shift_id = NEW.shift_id)
          AND sv.shift_id <> NEW.shift_id
    ) THEN
        RAISE EXCEPTION 'Volunteer already signed up for another shift on this date';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION create_notification(
    p_person_id INTEGER,
    p_type notification_type,
    p_title TEXT,
    p_message TEXT
) RETURNS INTEGER AS $$
DECLARE
    v_notification_id INTEGER;
BEGIN
    INSERT INTO notification (person_id, type, title, message)
    VALUES (p_person_id, p_type, p_title, p_message)
    RETURNING notification_id INTO v_notification_id;

    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION submit_adoption_application(
    p_animal_id INTEGER,
    p_candidate_id INTEGER
) RETURNS INTEGER AS $$
DECLARE
    v_application_id INTEGER;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM animal WHERE animal_id = p_animal_id AND status = 'available') THEN
        RAISE EXCEPTION 'Animal is not available for adoption';
    END IF;

    INSERT INTO adoption_application (animal_id, candidate_id)
    VALUES (p_animal_id, p_candidate_id)
    RETURNING application_id INTO v_application_id;

    RETURN v_application_id;
END;
$$ LANGUAGE plpgsql;

CREATE PROCEDURE schedule_interview(
    p_application_id INTEGER,
    p_interviewer_id INTEGER,
    p_scheduled_datetime TIMESTAMPTZ
) AS $$
DECLARE
    v_candidate_id INTEGER;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM adoption_application WHERE application_id = p_application_id) THEN
        RAISE EXCEPTION 'Application not found';
    END IF;

    INSERT INTO interview (application_id, interviewer_id, scheduled_datetime)
    VALUES (p_application_id, p_interviewer_id, p_scheduled_datetime);

    SELECT candidate_id INTO v_candidate_id
    FROM adoption_application
    WHERE application_id = p_application_id;

    PERFORM create_notification(
        v_candidate_id,
        'interview_scheduled',
        'Назначено интервью',
        format('Вам назначено интервью на %s', p_scheduled_datetime)
    );
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION complete_adoption(
    p_application_id INTEGER,
    p_post_adoption_plan TEXT
) RETURNS INTEGER AS $$
DECLARE
    v_agreement_id INTEGER;
    v_animal_id INTEGER;
    v_candidate_id INTEGER;
BEGIN
    SELECT animal_id, candidate_id
    INTO v_animal_id, v_candidate_id
    FROM adoption_application
    WHERE application_id = p_application_id AND status = 'approved';

    IF v_animal_id IS NULL THEN
        RAISE EXCEPTION 'Approved application not found';
    END IF;

    INSERT INTO agreement (application_id, post_adoption_plan)
    VALUES (p_application_id, p_post_adoption_plan)
    RETURNING agreement_id INTO v_agreement_id;

    UPDATE animal SET status = 'adopted' WHERE animal_id = v_animal_id;

    RETURN v_agreement_id;
END;
$$ LANGUAGE plpgsql;

CREATE PROCEDURE signup_for_shift(
    p_shift_id INTEGER,
    p_volunteer_id INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM person_roles pr
        JOIN role r ON r.role_id = pr.role_id
        WHERE pr.person_id = p_volunteer_id
          AND r.name = 'volunteer'
    ) THEN
        RAISE EXCEPTION 'Only volunteers can sign up for shifts';
    END IF;

    INSERT INTO shift_volunteer (shift_id, volunteer_id)
    VALUES (p_shift_id, p_volunteer_id);

    PERFORM create_notification(
        p_volunteer_id,
        'shift_reminder',
        'Запись на смену подтверждена',
        'Вы успешно записаны на смену'
    );
EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'Volunteer already signed up for this shift';
END;
$$;

CREATE FUNCTION submit_volunteer_application(
    p_person_id   INTEGER,
    p_motivation  TEXT,
    p_availability TEXT
) RETURNS INTEGER AS $$
DECLARE
    v_id INTEGER;
BEGIN
    IF p_person_id IS NULL OR NOT EXISTS (SELECT 1 FROM person WHERE person_id = p_person_id) THEN
        RAISE EXCEPTION 'Person not found';
    END IF;
    IF p_motivation IS NULL OR trim(p_motivation) = '' THEN
        RAISE EXCEPTION 'Motivation is required';
    END IF;
    IF EXISTS (
        SELECT 1 FROM volunteer_application
        WHERE person_id = p_person_id
          AND status IN ('submitted', 'under_review')
    ) THEN
        RAISE EXCEPTION 'Active volunteer application already exists';
    END IF;

    INSERT INTO volunteer_application (person_id, motivation, availability)
    VALUES (p_person_id, p_motivation, COALESCE(p_availability, ''))
    RETURNING application_id INTO v_id;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

CREATE PROCEDURE decide_volunteer_application(
    p_application_id INTEGER,
    p_status         volunteer_application_status,
    p_comment        TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_person_id INTEGER;
    v_role_id   INTEGER;
BEGIN
    SELECT person_id INTO v_person_id
    FROM volunteer_application
    WHERE application_id = p_application_id
    FOR UPDATE;

    IF v_person_id IS NULL THEN
        RAISE EXCEPTION 'Volunteer application not found';
    END IF;

    UPDATE volunteer_application
    SET status = p_status,
        decision_comment = p_comment,
        updated_at = NOW()
    WHERE application_id = p_application_id;

    IF p_status = 'approved' THEN
        SELECT role_id INTO v_role_id FROM role WHERE name = 'volunteer';
        IF v_role_id IS NOT NULL THEN
            INSERT INTO person_roles (role_id, person_id)
            VALUES (v_role_id, v_person_id)
            ON CONFLICT DO NOTHING;
        END IF;
        PERFORM create_notification(
            v_person_id,
            'new_application',
            'Заявка волонтера одобрена',
            'Ваша заявка на волонтерство одобрена, теперь можно записываться на смены.'
        );
    ELSIF p_status = 'rejected' THEN
        PERFORM create_notification(
            v_person_id,
            'new_application',
            'Заявка волонтера отклонена',
            COALESCE(p_comment, 'К сожалению, ваша заявка отклонена.')
        );
    ELSE
        PERFORM create_notification(
            v_person_id,
            'new_application',
            'Статус заявки обновлен',
            'Текущий статус заявки: ' || p_status::TEXT
        );
    END IF;
END;
$$;

CREATE FUNCTION book_interview_slot(
    p_slot_id        INTEGER,
    p_application_id INTEGER
) RETURNS INTEGER AS $$
DECLARE
    v_slot          interview_slot%ROWTYPE;
    v_candidate_id  INTEGER;
    v_interview_id  INTEGER;
BEGIN
    SELECT * INTO v_slot
    FROM interview_slot
    WHERE slot_id = p_slot_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Slot not found';
    END IF;

    IF v_slot.status <> 'available' THEN
        RAISE EXCEPTION 'Slot is not available';
    END IF;

    IF v_slot.scheduled_datetime < NOW() THEN
        UPDATE interview_slot SET status = 'expired' WHERE slot_id = p_slot_id;
        RAISE EXCEPTION 'Slot has expired';
    END IF;

    SELECT candidate_id INTO v_candidate_id
    FROM adoption_application
    WHERE application_id = p_application_id;

    IF v_candidate_id IS NULL THEN
        RAISE EXCEPTION 'Application not found';
    END IF;

    INSERT INTO interview (application_id, interviewer_id, scheduled_datetime)
    VALUES (p_application_id, v_slot.interviewer_id, v_slot.scheduled_datetime)
    RETURNING interview_id INTO v_interview_id;

    UPDATE interview_slot SET status = 'booked' WHERE slot_id = p_slot_id;

    PERFORM create_notification(
        v_candidate_id,
        'interview_scheduled',
        'Интервью назначено',
        format('Слот интервью забронирован на %s', v_slot.scheduled_datetime)
    );

    PERFORM create_notification(
        v_slot.interviewer_id,
        'interview_scheduled',
        'Слот интервью забронирован',
        format('Кандидат забронировал слот на %s', v_slot.scheduled_datetime)
    );

    RETURN v_interview_id;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION cancel_interview_slot(
    p_slot_id INTEGER,
    p_application_id INTEGER
) RETURNS VOID AS $$
DECLARE
    v_slot interview_slot%ROWTYPE;
BEGIN
    SELECT * INTO v_slot FROM interview_slot WHERE slot_id = p_slot_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Slot not found';
    END IF;
    IF v_slot.status <> 'booked' THEN
        RAISE EXCEPTION 'Slot is not booked';
    END IF;
    DELETE FROM interview
     WHERE application_id = p_application_id
       AND scheduled_datetime = v_slot.scheduled_datetime;
    UPDATE interview_slot SET status = 'available' WHERE slot_id = p_slot_id;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION process_post_adoption_reports()
RETURNS INTEGER AS $$
DECLARE
    rec RECORD;
    v_candidate_id INTEGER;
    v_notified INTEGER := 0;
    v_fill_days INTEGER := COALESCE((SELECT value::INT FROM system_setting WHERE key = 'report_fill_days'), 7);
BEGIN
    IF v_fill_days < 1 THEN
        v_fill_days := 1;
    END IF;

    FOR rec IN (
        SELECT r.report_id, r.agreement_id, r.due_date, r.status, r.last_reminded_at
        FROM post_adoption_report r
        WHERE r.status IN ('pending', 'overdue')
          AND r.submitted_date IS NULL
    ) LOOP
        IF rec.due_date < CURRENT_DATE AND rec.status <> 'overdue' THEN
            UPDATE post_adoption_report SET status = 'overdue' WHERE report_id = rec.report_id;
        END IF;

        IF CURRENT_DATE >= rec.due_date - v_fill_days THEN
            IF rec.last_reminded_at IS NULL OR rec.last_reminded_at::DATE < CURRENT_DATE THEN
                SELECT aa.candidate_id INTO v_candidate_id
                FROM agreement ag
                JOIN adoption_application aa ON aa.application_id = ag.application_id
                WHERE ag.agreement_id = rec.agreement_id;

                IF v_candidate_id IS NOT NULL THEN
                    PERFORM create_notification(
                        v_candidate_id,
                        'report_due',
                        'Напоминание об отчете',
                        format('Отчет по договору #%s. Срок: %s', rec.agreement_id, rec.due_date)
                    );
                    UPDATE post_adoption_report
                    SET last_reminded_at = NOW()
                    WHERE report_id = rec.report_id;
                    v_notified := v_notified + 1;
                END IF;
            END IF;
        END IF;
    END LOOP;

    RETURN v_notified;
END;
$$ LANGUAGE plpgsql;
