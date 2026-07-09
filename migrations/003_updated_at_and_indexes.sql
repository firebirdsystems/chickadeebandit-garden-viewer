-- Gardens gain an updated_at so renames/plan-image changes can be conflict-resolved
-- the same way plants are (last-write-wins keyed on updated_at). SQLite/D1 has no
-- ADD COLUMN IF NOT EXISTS, but migrations run exactly once per version so a plain
-- ADD COLUMN is safe.
ALTER TABLE app_garden_viewer__gardens
  ADD COLUMN updated_at TEXT;

UPDATE app_garden_viewer__gardens
  SET updated_at = created_at
  WHERE updated_at IS NULL;

-- Indexes for the per-plant / per-garden lookups the app runs on every
-- detail-screen and profile load (previously sequential scans).
CREATE INDEX IF NOT EXISTS plant_events_plant_idx
  ON app_garden_viewer__plant_events (plant_id, event_date);

CREATE INDEX IF NOT EXISTS care_reminders_plant_idx
  ON app_garden_viewer__care_reminders (plant_id, next_due_date);

CREATE INDEX IF NOT EXISTS garden_activity_garden_idx
  ON app_garden_viewer__garden_activity (garden_id, created_at);
