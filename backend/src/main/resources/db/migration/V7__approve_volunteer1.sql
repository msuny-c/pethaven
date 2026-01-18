INSERT INTO volunteer_application (person_id, first_name, last_name, email, phone, motivation, availability, status, decision_comment, created_at, updated_at)
SELECT 
    person_id,
    first_name,
    last_name,
    email,
    phone_number,
    'Готов помогать животным в приюте',
    'Готов работать в любое время',
    'approved',
    'Анкета одобрена администратором',
    NOW() - INTERVAL '30 days',
    NOW()
FROM person
WHERE email = 'volunteer1@shelter.ru'
  AND NOT EXISTS (
      SELECT 1 FROM volunteer_application WHERE person_id = person.person_id
  );

INSERT INTO volunteer_mentors (volunteer_id, approved_at)
SELECT 
    person_id,
    NOW()
FROM person
WHERE email = 'volunteer1@shelter.ru'
  AND NOT EXISTS (
      SELECT 1 FROM volunteer_mentors WHERE volunteer_id = person.person_id
  );
