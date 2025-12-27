CREATE OR REPLACE FUNCTION check_volunteer_availability() RETURNS TRIGGER AS $$
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
