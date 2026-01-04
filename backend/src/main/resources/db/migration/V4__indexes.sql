CREATE INDEX idx_person_roles_person ON person_roles(person_id);
CREATE INDEX idx_volunteer_mentors_mentor_orientation ON volunteer_mentors(mentor_id, orientation_date DESC);
CREATE INDEX idx_shift_volunteer_volunteer ON shift_volunteer(volunteer_id);
CREATE INDEX idx_task_shift_shift ON task_shift(shift_id);
CREATE INDEX idx_animal_status_id ON animal(status, animal_id);
CREATE INDEX idx_animal_media_animal_uploaded ON animal_media(animal_id, uploaded_at DESC);
CREATE INDEX idx_animal_catalog_available ON animal(species, breed, age) WHERE status = 'available';
CREATE INDEX idx_application_animal_status ON adoption_application(animal_id, status);
CREATE INDEX idx_application_candidate ON adoption_application(candidate_id);
CREATE INDEX idx_application_status_id ON adoption_application(status, application_id);
CREATE INDEX idx_interview_datetime ON interview(scheduled_datetime);
CREATE INDEX idx_interview_application ON interview(application_id, status);
CREATE INDEX idx_interview_interviewer_datetime ON interview(interviewer_id, scheduled_datetime);
CREATE INDEX idx_medical_record_due_date ON medical_record(next_due_date) WHERE next_due_date IS NOT NULL;
CREATE INDEX idx_medical_record_animal_id ON medical_record(animal_id, record_id DESC);
CREATE INDEX idx_medical_record_vet_id ON medical_record(vet_id, record_id DESC);
CREATE INDEX idx_shift_date_type ON shift(shift_date, shift_type);
CREATE INDEX idx_task_animal ON task(animal_id);
CREATE INDEX idx_task_status_due ON task(status, due_date);
CREATE INDEX idx_post_adoption_report_due_status ON post_adoption_report(due_date, status);
CREATE INDEX idx_post_adoption_report_agreement_due ON post_adoption_report(agreement_id, due_date);
CREATE INDEX idx_notification_person_created ON notification(person_id, created_at DESC);
CREATE UNIQUE INDEX idx_volunteer_application_active
    ON volunteer_application(person_id)
    WHERE status IN ('submitted', 'under_review');
CREATE INDEX idx_interview_slot_status_time
    ON interview_slot(status, scheduled_datetime);
CREATE INDEX idx_report_media_report ON report_media(report_id);
CREATE INDEX idx_animal_note_animal ON animal_note(animal_id, created_at DESC);
