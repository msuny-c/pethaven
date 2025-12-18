-- Mentor onboarding: allow_self_shifts flag and approval time
ALTER TABLE volunteer_mentors
    ADD COLUMN IF NOT EXISTS allow_self_shifts BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Enforce mentor approval before volunteer can join shifts
CREATE OR REPLACE PROCEDURE signup_for_shift(
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

    IF NOT EXISTS (
        SELECT 1
        FROM volunteer_mentors vm
        WHERE vm.volunteer_id = p_volunteer_id
          AND COALESCE(vm.allow_self_shifts, FALSE) = TRUE
    ) THEN
        RAISE EXCEPTION 'Volunteer is not cleared for shifts; mentor approval required';
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

-- Seed mentor approvals for demo volunteers
INSERT INTO volunteer_mentors (volunteer_id, mentor_id, orientation_date, mentor_feedback, allow_self_shifts, approved_at)
VALUES
    (4, 2, CURRENT_DATE - INTERVAL '7 days', 'Стажировка завершена', TRUE, NOW()),
    (5, 2, CURRENT_DATE - INTERVAL '5 days', 'Стажировка завершена', TRUE, NOW())
ON CONFLICT (volunteer_id) DO UPDATE
    SET allow_self_shifts = EXCLUDED.allow_self_shifts,
        approved_at = EXCLUDED.approved_at,
        mentor_feedback = EXCLUDED.mentor_feedback,
        orientation_date = EXCLUDED.orientation_date;
