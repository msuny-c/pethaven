INSERT INTO role (name, description) VALUES
('admin', 'Администратор системы'),
('coordinator', 'Координатор адопций'),
('volunteer', 'Волонтер приюта'),
('candidate', 'Кандидат на усыновление'),
('veterinar', 'Ветеринар');

INSERT INTO person (email, password_hash, first_name, last_name, phone_number) VALUES
('admin@shelter.ru', '$2b$12$FCTdQXaLnII9BXQgXrNw4.C8iWxHAGF9wQU8SOG8wcPdOC0og.y6u', 'Анна', 'Иванова', '+79990000001'),
('coordinator@shelter.ru', '$2b$12$E97c.qfI8EYzsd3GhG3vH.AIp8qvkmTFg2Pz.0Jz551p8f/comH2G', 'Петр', 'Сидоров', '+79990000002'),
('vet@shelter.ru', '$2b$12$VlgdERB4fjc/prctfqEAmOPXdNZbngpn/5kusVNNiFJDc9t8vQlWy', 'Мария', 'Петрова', '+79990000003'),
('volunteer1@shelter.ru', '$2b$12$/7sIR/Tna42zzeEXrRJry.e6dgyl3g/.QZq2WfwIKTGYLcwISjiny', 'Алексей', 'Васильев', '+79990000004'),
('volunteer2@shelter.ru', '$2b$12$fjEspyTETXnUULaB.99d7.fRXZcxdmVUy2GMA/c0Xs/wSEOW6UaTK', 'Ольга', 'Павлова', '+79990000005'),
('candidate1@mail.ru', '$2b$12$0FCAczK4JNVjv9CdkrToievK9DSfc2PnxRZq01yI8RW/DIXx.nn.a', 'Сергей', 'Морозов', '+79990000006'),
('candidate2@mail.ru', '$2b$12$9wDfYncnzu78h5bzA5KXLeeQHap4F5t8H6VdzaE6IwBjFf14gHDoK', 'Ирина', 'Смирнова', '+79990000007');

INSERT INTO person_roles (person_id, role_id) VALUES
(1, (SELECT role_id FROM role WHERE name = 'admin')),
(2, (SELECT role_id FROM role WHERE name = 'coordinator')),
(3, (SELECT role_id FROM role WHERE name = 'veterinar')),
(4, (SELECT role_id FROM role WHERE name = 'volunteer')),
(5, (SELECT role_id FROM role WHERE name = 'volunteer')),
(6, (SELECT role_id FROM role WHERE name = 'candidate')),
(7, (SELECT role_id FROM role WHERE name = 'candidate'));

INSERT INTO animal (name, species, breed, age, description, gender, ready_for_adoption, status, pending_admin_review) VALUES
('Барсик', 'cat', 'Британский', 24, 'Ласковый, любит детей. Вакцинирован, стерилизован.', 'male', TRUE, 'available', FALSE),
('Шарик', 'dog', 'Дворняжка', 12, 'Активный, нуждается в дрессировке. Обработан от паразитов.', 'male', TRUE, 'available', FALSE),
('Мурка', 'cat', 'Сиамская', 18, 'Игривая, самостоятельная. Стерилизована, вакцинирована.', 'female', TRUE, 'reserved', FALSE),
('Рекс', 'dog', 'Овчарка', 36, 'На карантине после поступления. Требуется вакцинация.', 'male', FALSE, 'quarantine', FALSE),
('Васька', 'cat', 'Метис', 8, 'Игривый, вакцинация в графике.', 'male', TRUE, 'available', FALSE);

INSERT INTO animal_media (animal_id, storage_key, description) VALUES
(1, 'photos/barsik1.jpg', 'Барсик'),
(2, 'photos/sharik1.jpg', 'Шарик'),
(3, 'photos/murka1.jpg', 'Мурка');

INSERT INTO medical_record (animal_id, vet_id, procedure, description, next_due_date) VALUES
(1, 3, 'Комплексная вакцинация', 'Вакцина от бешенства и комплексных инфекций', '2025-01-15'),
(2, 3, 'Вакцинация от бешенства', 'Ежегодная прививка от бешенства', '2025-01-10'),
(3, 3, 'Стерилизация', 'Хирургическая стерилизация', NULL),
(4, 3, 'Комплексная вакцинация', 'Вакцина от бешенства и комплексных инфекций', '2025-01-20'),
(5, 3, 'Обработка от паразитов', 'Обработка от блох и глистов', '2024-05-15');

INSERT INTO shift (shift_date, shift_type) VALUES
(CURRENT_DATE + 1, 'morning'),
(CURRENT_DATE + 1, 'evening'),
(CURRENT_DATE + 2, 'full_day');

INSERT INTO task (title, description, animal_id) VALUES
('Выгул Шарика', 'Выгулять собаку утром и вечером', 2),
('Социализация Барсика', 'Приучить кота к людям', 1),
('Уборка вольеров', 'Генеральная уборка в кошачьих вольерах', NULL);

INSERT INTO task_shift (task_id, shift_id, progress_notes) VALUES
(1, 1, 'Шарик хорошо погулял'),
(2, 1, 'Барсик адаптируется');

INSERT INTO system_setting(key, value)
VALUES ('report_interval_days', '30')
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_setting(key, value)
VALUES ('report_offset_days', '30')
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_setting(key, value)
VALUES ('report_fill_days', '7')
ON CONFLICT (key) DO NOTHING;
