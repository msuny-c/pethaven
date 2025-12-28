-- Align task_status enum with new "assigned" status name
ALTER TYPE task_status RENAME VALUE 'in_progress' TO 'assigned';
