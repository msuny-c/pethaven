DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status') THEN
        CREATE TYPE application_status AS ENUM ('submitted', 'under_review', 'approved', 'rejected');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'application_status' AND e.enumlabel = 'cancelled') THEN
        ALTER TYPE application_status ADD VALUE 'cancelled';
    END IF;
END $$;
