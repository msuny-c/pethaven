ALTER TABLE task_shift
    ADD COLUMN IF NOT EXISTS worked_hours INTEGER;
