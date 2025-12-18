-- Domain enums
CREATE TYPE animal_status AS ENUM ('quarantine', 'available', 'reserved', 'adopted', 'not_available');
CREATE TYPE application_status AS ENUM ('submitted', 'under_review', 'approved', 'rejected');
CREATE TYPE interview_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled');
CREATE TYPE report_status AS ENUM ('pending', 'submitted', 'overdue', 'reviewed');
CREATE TYPE shift_type AS ENUM ('morning', 'evening', 'full_day');
CREATE TYPE task_status AS ENUM ('open', 'in_progress', 'completed', 'cancelled');
CREATE TYPE attendance_status AS ENUM ('signed_up', 'attended', 'absent');
CREATE TYPE notification_type AS ENUM ('new_application', 'interview_scheduled', 'report_due', 'shift_reminder', 'task_assigned');
CREATE TYPE volunteer_application_status AS ENUM ('submitted', 'under_review', 'approved', 'rejected');
CREATE TYPE interview_slot_status AS ENUM ('available', 'booked', 'cancelled', 'expired');

-- Core tables
CREATE TABLE person (
    person_id       SERIAL PRIMARY KEY,
    email           TEXT UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    first_name      TEXT NOT NULL,
    last_name       TEXT NOT NULL,
    phone_number    TEXT,
    avatar_url      TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE role (
    role_id     SERIAL PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL
);

CREATE TABLE person_roles (
    role_id   INTEGER REFERENCES role(role_id) ON DELETE CASCADE,
    person_id INTEGER REFERENCES person(person_id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, person_id)
);

CREATE TABLE volunteer_mentors (
    volunteer_id     INTEGER PRIMARY KEY REFERENCES person(person_id) ON DELETE CASCADE,
    mentor_id        INTEGER REFERENCES person(person_id),
    orientation_date TIMESTAMPTZ,
    mentor_feedback  TEXT
);

CREATE TABLE animal (
    animal_id       SERIAL PRIMARY KEY,
    name            TEXT NOT NULL,
    species         TEXT NOT NULL,
    breed           TEXT,
    age             INTEGER CHECK (age >= 0),
    behavior_notes  TEXT,
    medical_summary TEXT,
    description     TEXT,
    gender          TEXT,
    vaccinated      BOOLEAN DEFAULT FALSE,
    sterilized      BOOLEAN DEFAULT FALSE,
    microchipped    BOOLEAN DEFAULT FALSE,
    status          animal_status DEFAULT 'quarantine'
);

CREATE TABLE animal_media (
    media_id    SERIAL PRIMARY KEY,
    animal_id   INTEGER NOT NULL REFERENCES animal(animal_id) ON DELETE CASCADE,
    file_url    TEXT NOT NULL,
    description TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE medical_record (
    record_id        SERIAL PRIMARY KEY,
    animal_id        INTEGER NOT NULL REFERENCES animal(animal_id) ON DELETE RESTRICT,
    vet_id           INTEGER NOT NULL REFERENCES person(person_id) ON DELETE RESTRICT,
    procedure        TEXT NOT NULL,
    description      TEXT NOT NULL,
    administered_date DATE NOT NULL,
    next_due_date     DATE CHECK (next_due_date >= administered_date)
);

CREATE TABLE adoption_application (
    application_id SERIAL PRIMARY KEY,
    animal_id      INTEGER NOT NULL REFERENCES animal(animal_id) ON DELETE RESTRICT,
    candidate_id   INTEGER NOT NULL REFERENCES person(person_id) ON DELETE RESTRICT,
    status         application_status DEFAULT 'submitted',
    reason         TEXT,
    experience     TEXT,
    housing        TEXT,
    decision_comment TEXT,
    created_at     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE interview (
    interview_id       SERIAL PRIMARY KEY,
    application_id     INTEGER NOT NULL REFERENCES adoption_application(application_id) ON DELETE RESTRICT,
    interviewer_id     INTEGER NOT NULL REFERENCES person(person_id),
    scheduled_datetime TIMESTAMPTZ NOT NULL,
    status             interview_status DEFAULT 'scheduled',
    coordinator_notes  TEXT
);

CREATE TABLE agreement (
    agreement_id      SERIAL PRIMARY KEY,
    application_id    INTEGER NOT NULL UNIQUE REFERENCES adoption_application(application_id),
    signed_date       DATE NOT NULL CHECK (signed_date <= CURRENT_DATE),
    post_adoption_plan TEXT NOT NULL
);

CREATE TABLE post_adoption_report (
    report_id        SERIAL PRIMARY KEY,
    agreement_id     INTEGER NOT NULL REFERENCES agreement(agreement_id) ON DELETE RESTRICT,
    due_date         DATE NOT NULL,
    submitted_date   DATE CHECK (submitted_date <= CURRENT_DATE),
    report_text      TEXT,
    volunteer_feedback TEXT,
    status           report_status DEFAULT 'pending',
    last_reminded_at TIMESTAMPTZ
);

CREATE TABLE shift (
    shift_id   SERIAL PRIMARY KEY,
    shift_date DATE NOT NULL CHECK (shift_date >= CURRENT_DATE),
    shift_type shift_type NOT NULL
);

CREATE TABLE task (
    task_id          SERIAL PRIMARY KEY,
    title            TEXT NOT NULL,
    description      TEXT,
    animal_id        INTEGER REFERENCES animal(animal_id) ON DELETE SET NULL,
    status           task_status DEFAULT 'open',
    estimated_shifts INTEGER DEFAULT 1 CHECK (estimated_shifts > 0),
    due_date         DATE CHECK (due_date >= CURRENT_DATE),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notification (
    notification_id SERIAL PRIMARY KEY,
    person_id       INTEGER NOT NULL REFERENCES person(person_id) ON DELETE CASCADE,
    type            notification_type NOT NULL,
    title           TEXT NOT NULL,
    message         TEXT NOT NULL,
    read            BOOLEAN DEFAULT FALSE NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE shift_volunteer (
    shift_id          INTEGER NOT NULL REFERENCES shift(shift_id) ON DELETE CASCADE,
    volunteer_id      INTEGER NOT NULL REFERENCES person(person_id),
    attendance_status attendance_status DEFAULT 'signed_up',
    PRIMARY KEY (shift_id, volunteer_id)
);

CREATE TABLE task_shift (
    task_id       INTEGER NOT NULL REFERENCES task(task_id) ON DELETE CASCADE,
    shift_id      INTEGER NOT NULL REFERENCES shift(shift_id) ON DELETE CASCADE,
    progress_notes TEXT,
    PRIMARY KEY (task_id, shift_id)
);

CREATE TABLE volunteer_application (
    application_id   SERIAL PRIMARY KEY,
    person_id        INTEGER NOT NULL REFERENCES person(person_id) ON DELETE CASCADE,
    motivation       TEXT NOT NULL,
    availability     TEXT,
    status           volunteer_application_status DEFAULT 'submitted',
    decision_comment TEXT,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE interview_slot (
    slot_id            SERIAL PRIMARY KEY,
    interviewer_id     INTEGER NOT NULL REFERENCES person(person_id) ON DELETE CASCADE,
    scheduled_datetime TIMESTAMPTZ NOT NULL,
    status             interview_slot_status DEFAULT 'available',
    created_at         TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (interviewer_id, scheduled_datetime)
);

CREATE TABLE refresh_token (
    token_id     SERIAL PRIMARY KEY,
    person_id    INTEGER NOT NULL REFERENCES person(person_id) ON DELETE CASCADE,
    token        TEXT NOT NULL UNIQUE,
    expires_at   TIMESTAMPTZ NOT NULL,
    revoked      BOOLEAN DEFAULT FALSE,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Triggers
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_updated_at
    BEFORE UPDATE ON task
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION check_duplicate_application() RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM adoption_application
        WHERE animal_id = NEW.animal_id
          AND candidate_id = NEW.candidate_id
          AND status IN ('submitted', 'under_review', 'approved')
    ) THEN
        RAISE EXCEPTION 'Active application for this animal already exists';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_duplicate_application
    BEFORE INSERT ON adoption_application
    FOR EACH ROW
    EXECUTE FUNCTION check_duplicate_application();

CREATE OR REPLACE FUNCTION check_volunteer_availability() RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM shift s
        JOIN shift_volunteer sv ON s.shift_id = sv.shift_id
        WHERE sv.volunteer_id = NEW.volunteer_id
          AND s.shift_date = (SELECT shift_date FROM shift WHERE shift_id = NEW.shift_id)
          AND sv.shift_id <> NEW.shift_id
    ) THEN
        RAISE EXCEPTION 'Volunteer already signed up for another shift on this date';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER volunteer_shift_conflict_check
    BEFORE INSERT ON shift_volunteer
    FOR EACH ROW
    EXECUTE FUNCTION check_volunteer_availability();

-- Stored procedures/functions for critical flows
CREATE OR REPLACE FUNCTION create_notification(
    p_person_id INTEGER,
    p_type notification_type,
    p_title TEXT,
    p_message TEXT
) RETURNS INTEGER AS $$
DECLARE
    v_notification_id INTEGER;
BEGIN
    INSERT INTO notification (person_id, type, title, message)
    VALUES (p_person_id, p_type, p_title, p_message)
    RETURNING notification_id INTO v_notification_id;

    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION submit_adoption_application(
    p_animal_id INTEGER,
    p_candidate_id INTEGER
) RETURNS INTEGER AS $$
DECLARE
    v_application_id INTEGER;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM animal WHERE animal_id = p_animal_id AND status = 'available') THEN
        RAISE EXCEPTION 'Animal is not available for adoption';
    END IF;

    INSERT INTO adoption_application (animal_id, candidate_id)
    VALUES (p_animal_id, p_candidate_id)
    RETURNING application_id INTO v_application_id;

    RETURN v_application_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE PROCEDURE schedule_interview(
    p_application_id INTEGER,
    p_interviewer_id INTEGER,
    p_scheduled_datetime TIMESTAMPTZ
) AS $$
DECLARE
    v_candidate_id INTEGER;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM adoption_application WHERE application_id = p_application_id) THEN
        RAISE EXCEPTION 'Application not found';
    END IF;

    INSERT INTO interview (application_id, interviewer_id, scheduled_datetime)
    VALUES (p_application_id, p_interviewer_id, p_scheduled_datetime);

    SELECT candidate_id INTO v_candidate_id
    FROM adoption_application
    WHERE application_id = p_application_id;

    PERFORM create_notification(
        v_candidate_id,
        'interview_scheduled',
        'Назначено интервью',
        format('Вам назначено интервью на %s', p_scheduled_datetime)
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION complete_adoption(
    p_application_id INTEGER,
    p_signed_date DATE,
    p_post_adoption_plan TEXT
) RETURNS INTEGER AS $$
DECLARE
    v_agreement_id INTEGER;
    v_animal_id INTEGER;
    v_candidate_id INTEGER;
    v_adopter_role_id INTEGER;
BEGIN
    SELECT animal_id, candidate_id
    INTO v_animal_id, v_candidate_id
    FROM adoption_application
    WHERE application_id = p_application_id AND status = 'approved';

    IF v_animal_id IS NULL THEN
        RAISE EXCEPTION 'Approved application not found';
    END IF;

    INSERT INTO agreement (application_id, signed_date, post_adoption_plan)
    VALUES (p_application_id, p_signed_date, p_post_adoption_plan)
    RETURNING agreement_id INTO v_agreement_id;

    UPDATE animal SET status = 'adopted' WHERE animal_id = v_animal_id;

    SELECT role_id INTO v_adopter_role_id FROM role WHERE name = 'adopter';

    IF v_adopter_role_id IS NOT NULL THEN
        INSERT INTO person_roles (role_id, person_id)
        VALUES (v_adopter_role_id, v_candidate_id)
        ON CONFLICT (role_id, person_id) DO NOTHING;
    END IF;

    RETURN v_agreement_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE PROCEDURE signup_for_shift(
    p_shift_id INTEGER,
    p_volunteer_id INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM person_roles pr
        JOIN role r ON r.role_id = pr.role_id
        WHERE pr.person_id = p_volunteer_id
          AND r.name = 'volunteer'
    ) THEN
        RAISE EXCEPTION 'Only volunteers can sign up for shifts';
    END IF;

    INSERT INTO shift_volunteer (shift_id, volunteer_id)
    VALUES (p_shift_id, p_volunteer_id);

    PERFORM create_notification(
        p_volunteer_id,
        'shift_reminder',
        'Запись на смену подтверждена',
        'Вы успешно записаны на смену'
    );
EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'Volunteer already signed up for this shift';
END;
$$;

CREATE OR REPLACE FUNCTION submit_volunteer_application(
    p_person_id   INTEGER,
    p_motivation  TEXT,
    p_availability TEXT
) RETURNS INTEGER AS $$
DECLARE
    v_id INTEGER;
BEGIN
    IF p_person_id IS NULL OR NOT EXISTS (SELECT 1 FROM person WHERE person_id = p_person_id) THEN
        RAISE EXCEPTION 'Person not found';
    END IF;
    IF p_motivation IS NULL OR trim(p_motivation) = '' THEN
        RAISE EXCEPTION 'Motivation is required';
    END IF;
    IF EXISTS (
        SELECT 1 FROM volunteer_application
        WHERE person_id = p_person_id
          AND status IN ('submitted', 'under_review')
    ) THEN
        RAISE EXCEPTION 'Active volunteer application already exists';
    END IF;

    INSERT INTO volunteer_application (person_id, motivation, availability)
    VALUES (p_person_id, p_motivation, COALESCE(p_availability, ''))
    RETURNING application_id INTO v_id;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE PROCEDURE decide_volunteer_application(
    p_application_id INTEGER,
    p_status         volunteer_application_status,
    p_comment        TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_person_id INTEGER;
    v_role_id   INTEGER;
BEGIN
    SELECT person_id INTO v_person_id
    FROM volunteer_application
    WHERE application_id = p_application_id
    FOR UPDATE;

    IF v_person_id IS NULL THEN
        RAISE EXCEPTION 'Volunteer application not found';
    END IF;

    UPDATE volunteer_application
    SET status = p_status,
        decision_comment = p_comment,
        updated_at = NOW()
    WHERE application_id = p_application_id;

    IF p_status = 'approved' THEN
        SELECT role_id INTO v_role_id FROM role WHERE name = 'volunteer';
        IF v_role_id IS NOT NULL THEN
            INSERT INTO person_roles (role_id, person_id)
            VALUES (v_role_id, v_person_id)
            ON CONFLICT DO NOTHING;
        END IF;
        PERFORM create_notification(
            v_person_id,
            'new_application',
            'Заявка волонтера одобрена',
            'Ваша заявка на волонтерство одобрена, теперь можно записываться на смены.'
        );
    ELSIF p_status = 'rejected' THEN
        PERFORM create_notification(
            v_person_id,
            'new_application',
            'Заявка волонтера отклонена',
            COALESCE(p_comment, 'К сожалению, ваша заявка отклонена.')
        );
    ELSE
        PERFORM create_notification(
            v_person_id,
            'new_application',
            'Статус заявки обновлен',
            'Текущий статус заявки: ' || p_status::TEXT
        );
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION book_interview_slot(
    p_slot_id        INTEGER,
    p_application_id INTEGER
) RETURNS INTEGER AS $$
DECLARE
    v_slot          interview_slot%ROWTYPE;
    v_candidate_id  INTEGER;
    v_interview_id  INTEGER;
BEGIN
    SELECT * INTO v_slot
    FROM interview_slot
    WHERE slot_id = p_slot_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Slot not found';
    END IF;

    IF v_slot.status <> 'available' THEN
        RAISE EXCEPTION 'Slot is not available';
    END IF;

    IF v_slot.scheduled_datetime < NOW() THEN
        UPDATE interview_slot SET status = 'expired' WHERE slot_id = p_slot_id;
        RAISE EXCEPTION 'Slot has expired';
    END IF;

    SELECT candidate_id INTO v_candidate_id
    FROM adoption_application
    WHERE application_id = p_application_id;

    IF v_candidate_id IS NULL THEN
        RAISE EXCEPTION 'Application not found';
    END IF;

    INSERT INTO interview (application_id, interviewer_id, scheduled_datetime)
    VALUES (p_application_id, v_slot.interviewer_id, v_slot.scheduled_datetime)
    RETURNING interview_id INTO v_interview_id;

    UPDATE interview_slot SET status = 'booked' WHERE slot_id = p_slot_id;

    PERFORM create_notification(
        v_candidate_id,
        'interview_scheduled',
        'Интервью назначено',
        format('Слот интервью забронирован на %s', v_slot.scheduled_datetime)
    );

    PERFORM create_notification(
        v_slot.interviewer_id,
        'interview_scheduled',
        'Слот интервью забронирован',
        format('Кандидат забронировал слот на %s', v_slot.scheduled_datetime)
    );

    RETURN v_interview_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cancel_interview_slot(
    p_slot_id INTEGER,
    p_application_id INTEGER
) RETURNS VOID AS $$
DECLARE
    v_slot interview_slot%ROWTYPE;
BEGIN
    SELECT * INTO v_slot FROM interview_slot WHERE slot_id = p_slot_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Slot not found';
    END IF;
    IF v_slot.status <> 'booked' THEN
        RAISE EXCEPTION 'Slot is not booked';
    END IF;
    DELETE FROM interview
     WHERE application_id = p_application_id
       AND scheduled_datetime = v_slot.scheduled_datetime;
    UPDATE interview_slot SET status = 'available' WHERE slot_id = p_slot_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION process_post_adoption_reports()
RETURNS INTEGER AS $$
DECLARE
    rec RECORD;
    v_candidate_id INTEGER;
    v_notified INTEGER := 0;
BEGIN
    FOR rec IN (
        SELECT r.report_id, r.agreement_id, r.due_date, r.status, r.last_reminded_at
        FROM post_adoption_report r
        WHERE r.status IN ('pending', 'overdue')
          AND r.submitted_date IS NULL
    ) LOOP
        IF rec.due_date < CURRENT_DATE AND rec.status <> 'overdue' THEN
            UPDATE post_adoption_report SET status = 'overdue' WHERE report_id = rec.report_id;
        END IF;

        IF rec.last_reminded_at IS NULL OR rec.last_reminded_at::DATE < CURRENT_DATE THEN
            SELECT aa.candidate_id INTO v_candidate_id
            FROM agreement ag
            JOIN adoption_application aa ON aa.application_id = ag.application_id
            WHERE ag.agreement_id = rec.agreement_id;

            IF v_candidate_id IS NOT NULL THEN
                PERFORM create_notification(
                    v_candidate_id,
                    'report_due',
                    'Напоминание об отчете',
                    format('Отчет по договору #%s. Срок: %s', rec.agreement_id, rec.due_date)
                );
                UPDATE post_adoption_report
                SET last_reminded_at = NOW()
                WHERE report_id = rec.report_id;
                v_notified := v_notified + 1;
            END IF;
        END IF;
    END LOOP;

    RETURN v_notified;
END;
$$ LANGUAGE plpgsql;

-- Seed data
INSERT INTO role (name, description) VALUES
('admin', 'Администратор системы'),
('coordinator', 'Координатор адопций'),
('volunteer', 'Волонтер приюта'),
('candidate', 'Кандидат на усыновление'),
('veterinar', 'Ветеринар'),
('adopter', 'Новый владелец');

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

INSERT INTO animal (name, species, breed, age, behavior_notes, medical_summary, status) VALUES
('Барсик', 'cat', 'Британский', 24, 'Ласковый, любит детей', 'Вакцинирован, стерилизован', 'available'),
('Шарик', 'dog', 'Дворняжка', 12, 'Активный, нуждается в дрессировке', 'Обработан от паразитов', 'available'),
('Мурка', 'cat', 'Сиамская', 18, 'Игривая, самостоятельная', 'Стерилизована, вакцинирована', 'reserved'),
('Рекс', 'dog', 'Овчарка', 36, 'На карантине после поступления', 'Требуется вакцинация', 'quarantine'),
('Васька', 'cat', 'Метис', 8, 'Игривый', 'Вакцинация в графике', 'available');

INSERT INTO animal_media (animal_id, file_url, description) VALUES
(1, '/photos/barsik1.jpg', 'Барсик'),
(2, '/photos/sharik1.jpg', 'Шарик'),
(3, '/photos/murka1.jpg', 'Мурка');

INSERT INTO medical_record (animal_id, vet_id, procedure, description, administered_date, next_due_date) VALUES
(1, 3, 'Комплексная вакцинация', 'Вакцина от бешенства и комплексных инфекций', '2024-01-15', '2025-01-15'),
(2, 3, 'Вакцинация от бешенства', 'Ежегодная прививка от бешенства', '2024-01-10', '2025-01-10'),
(3, 3, 'Стерилизация', 'Хирургическая стерилизация', '2024-02-01', NULL),
(4, 3, 'Комплексная вакцинация', 'Вакцина от бешенства и комплексных инфекций', '2024-01-20', '2025-01-20'),
(5, 3, 'Обработка от паразитов', 'Обработка от блох и глистов', '2024-02-15', '2024-05-15');

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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_person_roles_person ON person_roles(person_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_mentors_mentor_orientation ON volunteer_mentors(mentor_id, orientation_date DESC);
CREATE INDEX IF NOT EXISTS idx_shift_volunteer_volunteer ON shift_volunteer(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_task_shift_shift ON task_shift(shift_id);
CREATE INDEX IF NOT EXISTS idx_animal_status_id ON animal(status, animal_id);
CREATE INDEX IF NOT EXISTS idx_animal_media_animal_uploaded ON animal_media(animal_id, uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_animal_catalog_available ON animal(species, breed, age) WHERE status = 'available';
CREATE INDEX IF NOT EXISTS idx_application_animal_status ON adoption_application(animal_id, status);
CREATE INDEX IF NOT EXISTS idx_application_candidate ON adoption_application(candidate_id);
CREATE INDEX IF NOT EXISTS idx_application_status_id ON adoption_application(status, application_id);
CREATE INDEX IF NOT EXISTS idx_interview_datetime ON interview(scheduled_datetime);
CREATE INDEX IF NOT EXISTS idx_interview_application ON interview(application_id, status);
CREATE INDEX IF NOT EXISTS idx_interview_interviewer_datetime ON interview(interviewer_id, scheduled_datetime);
CREATE INDEX IF NOT EXISTS idx_medical_record_animal_date ON medical_record(animal_id, administered_date DESC);
CREATE INDEX IF NOT EXISTS idx_medical_record_due_date ON medical_record(next_due_date) WHERE next_due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_medical_record_vet_date ON medical_record(vet_id, administered_date DESC);
CREATE INDEX IF NOT EXISTS idx_shift_date_type ON shift(shift_date, shift_type);
CREATE INDEX IF NOT EXISTS idx_task_animal ON task(animal_id);
CREATE INDEX IF NOT EXISTS idx_task_status_due ON task(status, due_date);
CREATE INDEX IF NOT EXISTS idx_post_adoption_report_due_status ON post_adoption_report(due_date, status);
CREATE INDEX IF NOT EXISTS idx_post_adoption_report_agreement_due ON post_adoption_report(agreement_id, due_date);
CREATE INDEX IF NOT EXISTS idx_agreement_signed_date ON agreement(signed_date DESC);
CREATE INDEX IF NOT EXISTS idx_notification_person_created ON notification(person_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_volunteer_application_active
    ON volunteer_application(person_id)
    WHERE status IN ('submitted', 'under_review');
CREATE INDEX IF NOT EXISTS idx_interview_slot_status_time
    ON interview_slot(status, scheduled_datetime);
CREATE INDEX IF NOT EXISTS idx_refresh_token_person ON refresh_token(person_id);
