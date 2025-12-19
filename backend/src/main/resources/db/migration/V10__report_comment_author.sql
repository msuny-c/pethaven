ALTER TABLE post_adoption_report
    ADD COLUMN IF NOT EXISTS comment_author_id INTEGER REFERENCES person(person_id);
