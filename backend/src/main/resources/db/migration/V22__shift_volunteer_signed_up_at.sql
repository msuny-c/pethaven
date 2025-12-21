ALTER TABLE shift_volunteer
    ADD COLUMN IF NOT EXISTS signed_up_at TIMESTAMPTZ DEFAULT NOW();

UPDATE shift_volunteer
SET signed_up_at = COALESCE(signed_up_at, NOW());
