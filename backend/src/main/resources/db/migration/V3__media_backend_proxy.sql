-- Добавляем ключ для медиа и аватаров, убираем file_url
ALTER TABLE animal_media ADD COLUMN IF NOT EXISTS storage_key TEXT;
ALTER TABLE person ADD COLUMN IF NOT EXISTS avatar_key TEXT;

-- Делаем file_url опциональным и удаляем значения, чтобы не сохранять прокси-URL
ALTER TABLE animal_media ALTER COLUMN file_url DROP NOT NULL;
UPDATE animal_media SET file_url = NULL;
UPDATE person SET avatar_url = NULL;
