ALTER TABLE animal
    ADD COLUMN IF NOT EXISTS behavior_notes text[];

UPDATE animal
SET behavior_notes = '{}'
WHERE behavior_notes IS NULL;
