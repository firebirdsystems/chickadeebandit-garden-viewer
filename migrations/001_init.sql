CREATE TABLE IF NOT EXISTS app_garden_viewer__gardens (
  id             TEXT NOT NULL,
  name           TEXT NOT NULL,
  garden_type    TEXT NOT NULL DEFAULT 'map',
  plan_image_url TEXT,
  created_at     TEXT NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS app_garden_viewer__plants (
  id              TEXT NOT NULL,
  garden_id       TEXT NOT NULL,
  common_name     TEXT NOT NULL,
  scientific_name TEXT,
  plant_type      TEXT,
  bed_name        TEXT,
  notes           TEXT,
  photo_urls      TEXT NOT NULL DEFAULT '[]',
  lat             REAL,
  lng             REAL,
  added_by_name   TEXT,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS app_garden_viewer__plant_events (
  id            TEXT NOT NULL,
  plant_id      TEXT NOT NULL,
  garden_id     TEXT NOT NULL,
  event_type    TEXT NOT NULL,
  event_date    TEXT NOT NULL,
  notes         TEXT,
  added_by_name TEXT,
  created_at    TEXT NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS app_garden_viewer__care_reminders (
  id             TEXT NOT NULL,
  plant_id       TEXT NOT NULL,
  garden_id      TEXT NOT NULL,
  reminder_type  TEXT NOT NULL,
  frequency_days INTEGER NOT NULL,
  next_due_date  TEXT NOT NULL,
  notes          TEXT,
  added_by_name  TEXT,
  created_at     TEXT NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS app_garden_viewer__garden_activity (
  id           TEXT NOT NULL,
  garden_id    TEXT NOT NULL,
  actor_name   TEXT NOT NULL,
  action       TEXT NOT NULL,
  subject_name TEXT,
  created_at   TEXT NOT NULL,
  PRIMARY KEY (id)
);
