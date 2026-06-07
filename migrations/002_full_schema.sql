CREATE TABLE IF NOT EXISTS plant_events (
  household_id  UUID NOT NULL DEFAULT current_setting('app.household_id', true)::uuid,
  id            TEXT NOT NULL,
  plant_id      TEXT NOT NULL,
  garden_id     TEXT NOT NULL,
  event_type    TEXT NOT NULL,
  event_date    TEXT NOT NULL,
  notes         TEXT,
  added_by_name TEXT,
  created_at    TEXT NOT NULL,
  PRIMARY KEY (household_id, id)
);

CREATE TABLE IF NOT EXISTS care_reminders (
  household_id   UUID NOT NULL DEFAULT current_setting('app.household_id', true)::uuid,
  id             TEXT NOT NULL,
  plant_id       TEXT NOT NULL,
  garden_id      TEXT NOT NULL,
  reminder_type  TEXT NOT NULL,
  frequency_days INTEGER NOT NULL,
  next_due_date  TEXT NOT NULL,
  notes          TEXT,
  added_by_name  TEXT,
  created_at     TEXT NOT NULL,
  PRIMARY KEY (household_id, id)
);

CREATE TABLE IF NOT EXISTS garden_activity (
  household_id UUID NOT NULL DEFAULT current_setting('app.household_id', true)::uuid,
  id           TEXT NOT NULL,
  garden_id    TEXT NOT NULL,
  actor_name   TEXT NOT NULL,
  action       TEXT NOT NULL,
  subject_name TEXT,
  created_at   TEXT NOT NULL,
  PRIMARY KEY (household_id, id)
);
