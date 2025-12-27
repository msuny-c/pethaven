-- Отмечаем существующих волонтёров как прошедших проверку администратором
INSERT INTO volunteer_application (person_id, motivation, availability, status, decision_comment, created_at, updated_at)
SELECT p.person_id,
       'Системная запись',
       '',
       'approved',
       'Одобрено администратором',
       NOW(),
       NOW()
FROM person p
         JOIN person_roles pr ON pr.person_id = p.person_id
         JOIN role r ON r.role_id = pr.role_id AND r.name = 'volunteer'
WHERE NOT EXISTS (
    SELECT 1 FROM volunteer_application va WHERE va.person_id = p.person_id
);

UPDATE volunteer_application va
SET status = 'approved',
    decision_comment = COALESCE(va.decision_comment, 'Одобрено администратором'),
    updated_at = NOW()
WHERE va.person_id IN (
    SELECT pr.person_id
    FROM person_roles pr
             JOIN role r ON r.role_id = pr.role_id AND r.name = 'volunteer'
)
  AND va.status <> 'approved';
