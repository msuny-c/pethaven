-- Создаем enum с допустимыми процедурами
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'medical_procedure_type') THEN
        CREATE TYPE medical_procedure_type AS ENUM ('vaccination', 'sterilization', 'microchip');
    END IF;
END $$;

-- Приводим существующие данные к допустимым значениям
UPDATE medical_record
SET procedure = 'vaccination'
WHERE procedure NOT IN ('vaccination', 'sterilization', 'microchip') OR procedure IS NULL;

-- Обновляем описания согласно фиксированным значениям
UPDATE medical_record SET description = 'Вакцинация выполнена' WHERE procedure = 'vaccination';
UPDATE medical_record SET description = 'Стерилизация выполнена' WHERE procedure = 'sterilization';
UPDATE medical_record SET description = 'Чип установлен' WHERE procedure = 'microchip';

-- Меняем тип столбца на enum
ALTER TABLE medical_record
    ALTER COLUMN procedure TYPE medical_procedure_type USING procedure::medical_procedure_type,
    ALTER COLUMN procedure SET NOT NULL,
    ALTER COLUMN description SET NOT NULL;

-- Ограничиваем описание, чтобы оно соответствовало типу процедуры
ALTER TABLE medical_record
    DROP CONSTRAINT IF EXISTS chk_medical_record_description,
    ADD CONSTRAINT chk_medical_record_description CHECK (
            (procedure = 'vaccination' AND description = 'Вакцинация выполнена')
        OR  (procedure = 'sterilization' AND description = 'Стерилизация выполнена')
        OR  (procedure = 'microchip' AND description = 'Чип установлен')
    );
