-- Удаляем устаревшее поле file_url, так как URL формируется динамически
ALTER TABLE animal_media DROP COLUMN IF EXISTS file_url;
