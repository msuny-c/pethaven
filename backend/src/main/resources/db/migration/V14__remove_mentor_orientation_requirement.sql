-- Drop mentor approval restriction for shift signup
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
