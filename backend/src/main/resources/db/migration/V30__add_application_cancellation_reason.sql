ALTER TABLE adoption_application
    ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
