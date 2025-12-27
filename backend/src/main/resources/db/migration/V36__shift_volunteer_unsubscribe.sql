ALTER TABLE shift_volunteer
    ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
