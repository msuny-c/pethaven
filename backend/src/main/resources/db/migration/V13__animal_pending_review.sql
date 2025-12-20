-- Добавляем статус ожидания проверки карточки
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t
                 JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'animal_status'
          AND e.enumlabel = 'pending_review'
    ) THEN
        ALTER TYPE animal_status ADD VALUE 'pending_review';
    END IF;
END;
$$;
