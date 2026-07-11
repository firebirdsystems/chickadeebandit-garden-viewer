-- Care reminders become editable offline in the mobile app (next_due_date
-- advances, frequency/notes change), so they need an updated_at for the same
-- last-write-wins conflict resolution plants and gardens use. Same pattern as
-- migration 003: migrations run exactly once per version, so a plain ADD
-- COLUMN is safe.
ALTER TABLE app_garden_viewer__care_reminders
  ADD COLUMN updated_at TEXT;

UPDATE app_garden_viewer__care_reminders
  SET updated_at = created_at
  WHERE updated_at IS NULL;
