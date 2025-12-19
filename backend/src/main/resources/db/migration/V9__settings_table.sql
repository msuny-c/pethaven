CREATE TABLE IF NOT EXISTS system_setting (
    key   TEXT PRIMARY KEY,
    value TEXT
);

INSERT INTO system_setting(key, value)
VALUES ('report_interval_days', '30')
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_setting(key, value)
VALUES ('vaccination_interval_days', '365')
ON CONFLICT (key) DO NOTHING;
