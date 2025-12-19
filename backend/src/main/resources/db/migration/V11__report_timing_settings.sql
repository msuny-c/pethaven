-- Add separate settings for report offset and fill window
INSERT INTO system_setting(key, value)
VALUES ('report_offset_days', '30')
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_setting(key, value)
VALUES ('report_fill_days', '7')
ON CONFLICT (key) DO NOTHING;

-- Update reminders to respect the fill window: уведомления начинаются, когда остаётся окно на заполнение
CREATE OR REPLACE FUNCTION process_post_adoption_reports()
RETURNS INTEGER AS $$
DECLARE
    rec RECORD;
    v_candidate_id INTEGER;
    v_notified INTEGER := 0;
    v_fill_days INTEGER := COALESCE((SELECT value::INT FROM system_setting WHERE key = 'report_fill_days'), 7);
BEGIN
    IF v_fill_days < 1 THEN
        v_fill_days := 1;
    END IF;

    FOR rec IN (
        SELECT r.report_id, r.agreement_id, r.due_date, r.status, r.last_reminded_at
        FROM post_adoption_report r
        WHERE r.status IN ('pending', 'overdue')
          AND r.submitted_date IS NULL
    ) LOOP
        IF rec.due_date < CURRENT_DATE AND rec.status <> 'overdue' THEN
            UPDATE post_adoption_report SET status = 'overdue' WHERE report_id = rec.report_id;
        END IF;

        -- Напоминать только когда началось окно заполнения (due_date - fill_days)
        IF CURRENT_DATE >= rec.due_date - v_fill_days THEN
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
        END IF;
    END LOOP;

    RETURN v_notified;
END;
$$ LANGUAGE plpgsql;
