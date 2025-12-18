-- Удаляем роль adopter как отдельную
DELETE FROM role WHERE name = 'adopter';

-- Обновляем процедуру complete_adoption: не добавлять роль
CREATE OR REPLACE FUNCTION complete_adoption(
    p_application_id INTEGER,
    p_signed_date DATE,
    p_post_adoption_plan TEXT
) RETURNS INTEGER AS $$
DECLARE
    v_agreement_id INTEGER;
    v_animal_id INTEGER;
    v_candidate_id INTEGER;
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

    RETURN v_agreement_id;
END;
$$ LANGUAGE plpgsql;
