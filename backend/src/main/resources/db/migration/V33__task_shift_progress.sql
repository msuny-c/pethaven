ALTER TABLE task_shift
    ADD COLUMN IF NOT EXISTS task_state TEXT NOT NULL DEFAULT 'open';

UPDATE task_shift SET task_state = 'done' WHERE completed = TRUE;
