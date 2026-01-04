-- Domain enums
CREATE TYPE animal_status AS ENUM ('quarantine', 'pending_review', 'available', 'reserved', 'adopted', 'not_available');
CREATE TYPE application_status AS ENUM ('submitted', 'under_review', 'approved', 'rejected', 'cancelled');
CREATE TYPE interview_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled');
CREATE TYPE report_status AS ENUM ('pending', 'submitted', 'overdue', 'reviewed');
CREATE TYPE shift_type AS ENUM ('morning', 'evening', 'full_day');
CREATE TYPE task_status AS ENUM ('open', 'assigned', 'completed', 'cancelled');
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
    avatar_key      TEXT,
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
    volunteer_id      INTEGER PRIMARY KEY REFERENCES person(person_id) ON DELETE CASCADE,
    mentor_id         INTEGER REFERENCES person(person_id),
    orientation_date  TIMESTAMPTZ,
    mentor_feedback   TEXT,
    allow_self_shifts BOOLEAN DEFAULT FALSE,
    approved_at       TIMESTAMPTZ
);

CREATE TABLE animal (
    animal_id            SERIAL PRIMARY KEY,
    name                 TEXT NOT NULL,
    species              TEXT NOT NULL,
    breed                TEXT,
    age                  INTEGER CHECK (age >= 0),
    description          TEXT,
    behavior_notes       TEXT[] DEFAULT '{}',
    admin_review_comment TEXT,
    gender               TEXT,
    ready_for_adoption   BOOLEAN NOT NULL DEFAULT FALSE,
    status               animal_status DEFAULT 'quarantine',
    pending_admin_review BOOLEAN DEFAULT FALSE
);

CREATE TABLE animal_media (
    media_id    SERIAL PRIMARY KEY,
    animal_id   INTEGER NOT NULL REFERENCES animal(animal_id) ON DELETE CASCADE,
    storage_key TEXT,
    description TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE medical_record (
    record_id     SERIAL PRIMARY KEY,
    animal_id     INTEGER NOT NULL REFERENCES animal(animal_id) ON DELETE RESTRICT,
    vet_id        INTEGER NOT NULL REFERENCES person(person_id) ON DELETE RESTRICT,
    procedure     TEXT,
    description   TEXT NOT NULL,
    next_due_date DATE
);

CREATE TABLE adoption_application (
    application_id    SERIAL PRIMARY KEY,
    animal_id         INTEGER NOT NULL REFERENCES animal(animal_id) ON DELETE RESTRICT,
    candidate_id      INTEGER NOT NULL REFERENCES person(person_id) ON DELETE RESTRICT,
    status            application_status DEFAULT 'submitted',
    reason            TEXT,
    experience        TEXT,
    housing           TEXT,
    decision_comment  TEXT,
    consent_given     BOOLEAN DEFAULT FALSE NOT NULL,
    passport_key      TEXT,
    cancellation_reason TEXT,
    created_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    processed_by      BIGINT REFERENCES person(person_id)
);

CREATE TABLE interview (
    interview_id       SERIAL PRIMARY KEY,
    application_id     INTEGER NOT NULL REFERENCES adoption_application(application_id) ON DELETE RESTRICT,
    interviewer_id     INTEGER NOT NULL REFERENCES person(person_id),
    scheduled_datetime TIMESTAMPTZ NOT NULL,
    status             interview_status DEFAULT 'scheduled',
    coordinator_notes  TEXT,
    processed_by       BIGINT REFERENCES person(person_id)
);

CREATE TABLE agreement (
    agreement_id        SERIAL PRIMARY KEY,
    application_id      INTEGER NOT NULL UNIQUE REFERENCES adoption_application(application_id),
    post_adoption_plan  TEXT NOT NULL,
    template_storage_key TEXT,
    signed_storage_key  TEXT,
    generated_at        TIMESTAMPTZ,
    signed_at           TIMESTAMPTZ,
    confirmed_at        TIMESTAMPTZ,
    confirmed_by        INTEGER
);

CREATE TABLE post_adoption_report (
    report_id          SERIAL PRIMARY KEY,
    agreement_id       INTEGER NOT NULL REFERENCES agreement(agreement_id) ON DELETE RESTRICT,
    due_date           DATE NOT NULL,
    submitted_date     DATE CHECK (submitted_date <= CURRENT_DATE),
    report_text        TEXT,
    volunteer_feedback TEXT,
    status             report_status DEFAULT 'pending',
    last_reminded_at   TIMESTAMPTZ,
    comment_author_id  INTEGER REFERENCES person(person_id)
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
    signed_up_at      TIMESTAMPTZ DEFAULT NOW(),
    submitted_at      TIMESTAMPTZ,
    approved_at       TIMESTAMPTZ,
    worked_hours      INTEGER DEFAULT 0,
    volunteer_feedback TEXT,
    cancel_reason     TEXT,
    PRIMARY KEY (shift_id, volunteer_id)
);

CREATE TABLE task_shift (
    task_id        INTEGER NOT NULL REFERENCES task(task_id) ON DELETE CASCADE,
    shift_id       INTEGER NOT NULL REFERENCES shift(shift_id) ON DELETE CASCADE,
    progress_notes TEXT,
    completed      BOOLEAN DEFAULT FALSE,
    completed_at   TIMESTAMPTZ,
    completed_by   INTEGER REFERENCES person(person_id),
    task_state     TEXT NOT NULL DEFAULT 'open',
    worked_hours   INTEGER,
    PRIMARY KEY (task_id, shift_id)
);

CREATE TABLE volunteer_application (
    application_id   SERIAL PRIMARY KEY,
    person_id        INTEGER NOT NULL REFERENCES person(person_id) ON DELETE CASCADE,
    first_name       TEXT,
    last_name        TEXT,
    email            TEXT,
    phone            TEXT,
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

CREATE TABLE report_media (
    media_id    SERIAL PRIMARY KEY,
    report_id   INTEGER NOT NULL REFERENCES post_adoption_report(report_id) ON DELETE CASCADE,
    storage_key TEXT NOT NULL,
    description TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE system_setting (
    key   TEXT PRIMARY KEY,
    value TEXT
);

CREATE TABLE animal_note (
    note_id    SERIAL PRIMARY KEY,
    animal_id  INTEGER NOT NULL REFERENCES animal(animal_id) ON DELETE CASCADE,
    author_id  INTEGER REFERENCES person(person_id) ON DELETE SET NULL,
    note       TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
