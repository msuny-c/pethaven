-- Помечаем существующих волонтёров как прошедших проверку
UPDATE volunteer_mentors
SET approved_at = COALESCE(approved_at, NOW())
WHERE volunteer_id IS NOT NULL;

-- Фидбек волонтёра по смене
ALTER TABLE shift_volunteer
    ADD COLUMN IF NOT EXISTS volunteer_feedback TEXT;

-- Статус выполнения задачи в рамках смены
ALTER TABLE task_shift
    ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS completed_by INTEGER REFERENCES person(person_id);

UPDATE task_shift
SET completed = COALESCE(completed, FALSE)
WHERE completed IS NULL;
