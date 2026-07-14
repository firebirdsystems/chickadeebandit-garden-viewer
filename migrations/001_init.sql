CREATE TABLE IF NOT EXISTS app_garden_viewer__gardens (
  id             TEXT NOT NULL,
  name           TEXT NOT NULL,
  garden_type    TEXT NOT NULL DEFAULT 'map',
  plan_image_url TEXT,
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  version        INTEGER NOT NULL DEFAULT 1,
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
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  version         INTEGER NOT NULL DEFAULT 1,
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
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
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
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  version        INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS app_garden_viewer__garden_activity (
  id           TEXT NOT NULL,
  garden_id    TEXT NOT NULL,
  actor_name   TEXT NOT NULL,
  action       TEXT NOT NULL,
  subject_name TEXT,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (id)
);

-- Read-only monotonic feed appended through the Hub protocol endpoint.
CREATE TABLE IF NOT EXISTS app_garden_viewer__changes (
  seq         INTEGER PRIMARY KEY AUTOINCREMENT,
  id          TEXT NOT NULL UNIQUE,
  entity_type TEXT NOT NULL,
  entity_id   TEXT NOT NULL,
  operation   TEXT NOT NULL CHECK (operation IN ('upsert', 'delete')),
  changed_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS app_garden_viewer__changes_seq_idx
  ON app_garden_viewer__changes (seq);

CREATE INDEX IF NOT EXISTS plants_garden_idx
  ON app_garden_viewer__plants (garden_id, common_name);

CREATE INDEX IF NOT EXISTS plant_events_plant_idx
  ON app_garden_viewer__plant_events (plant_id, event_date);

CREATE INDEX IF NOT EXISTS care_reminders_plant_idx
  ON app_garden_viewer__care_reminders (plant_id, next_due_date);

CREATE INDEX IF NOT EXISTS garden_activity_garden_idx
  ON app_garden_viewer__garden_activity (garden_id, created_at);

CREATE INDEX IF NOT EXISTS garden_activity_retention_idx
  ON app_garden_viewer__garden_activity (created_at, id);
