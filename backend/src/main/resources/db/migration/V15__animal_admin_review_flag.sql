ALTER TABLE animal
    ADD COLUMN IF NOT EXISTS pending_admin_review BOOLEAN DEFAULT FALSE;

-- Migrate old pending_review status into flag and move status back to quarantine to avoid stuck enum
UPDATE animal
SET pending_admin_review = TRUE,
    status = 'quarantine'
WHERE status = 'pending_review';
