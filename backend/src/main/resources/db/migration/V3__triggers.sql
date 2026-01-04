CREATE TRIGGER task_updated_at
    BEFORE UPDATE ON task
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER prevent_duplicate_application
    BEFORE INSERT ON adoption_application
    FOR EACH ROW
    EXECUTE FUNCTION check_duplicate_application();

CREATE TRIGGER volunteer_shift_conflict_check
    BEFORE INSERT ON shift_volunteer
    FOR EACH ROW
    EXECUTE FUNCTION check_volunteer_availability();
