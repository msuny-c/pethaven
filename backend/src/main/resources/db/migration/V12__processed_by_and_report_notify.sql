-- Track who processed adoption applications and interviews
ALTER TABLE adoption_application
    ADD COLUMN IF NOT EXISTS processed_by BIGINT REFERENCES person(person_id);

ALTER TABLE interview
    ADD COLUMN IF NOT EXISTS processed_by BIGINT REFERENCES person(person_id);

-- Notify coordinators on new post-adoption reports
-- (handled in application logic)
