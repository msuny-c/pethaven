CREATE TABLE IF NOT EXISTS report_media (
    media_id    SERIAL PRIMARY KEY,
    report_id   INTEGER NOT NULL REFERENCES post_adoption_report(report_id) ON DELETE CASCADE,
    storage_key TEXT NOT NULL,
    description TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_media_report ON report_media(report_id);
