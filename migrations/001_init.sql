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

-- Monotonic change feed for efficient incremental sync. This table is exposed
-- read-only by the manifest; only these triggers write to it.
CREATE TABLE IF NOT EXISTS app_garden_viewer__changes (
  seq         INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL,
  entity_id   TEXT NOT NULL,
  operation   TEXT NOT NULL CHECK (operation IN ('upsert', 'delete')),
  changed_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS app_garden_viewer__changes_seq_idx
  ON app_garden_viewer__changes (seq);

-- Query and retention indexes.
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

-- Existing clients still send their local updated_at value. Keep the Hub as
-- the authority by replacing it and advancing the revision whenever mutable
-- content changes. A future optimistic update may advance version itself; the
-- WHEN guard prevents this trigger from advancing it twice.
CREATE TRIGGER IF NOT EXISTS app_garden_viewer__gardens_revision_update
AFTER UPDATE OF name, garden_type, plan_image_url ON app_garden_viewer__gardens
WHEN NEW.version = OLD.version
BEGIN
  UPDATE app_garden_viewer__gardens
  SET version = OLD.version + 1,
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS app_garden_viewer__plants_revision_update
AFTER UPDATE OF garden_id, common_name, scientific_name, plant_type, bed_name,
  notes, photo_urls, lat, lng, added_by_name ON app_garden_viewer__plants
WHEN NEW.version = OLD.version
BEGIN
  UPDATE app_garden_viewer__plants
  SET version = OLD.version + 1,
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS app_garden_viewer__care_reminders_revision_update
AFTER UPDATE OF plant_id, garden_id, reminder_type, frequency_days,
  next_due_date, notes, added_by_name ON app_garden_viewer__care_reminders
WHEN NEW.version = OLD.version
BEGIN
  UPDATE app_garden_viewer__care_reminders
  SET version = OLD.version + 1,
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS app_garden_viewer__gardens_change_insert
AFTER INSERT ON app_garden_viewer__gardens BEGIN
  INSERT INTO app_garden_viewer__changes (entity_type, entity_id, operation)
  VALUES ('gardens', NEW.id, 'upsert');
END;
CREATE TRIGGER IF NOT EXISTS app_garden_viewer__gardens_change_update
AFTER UPDATE OF name, garden_type, plan_image_url ON app_garden_viewer__gardens BEGIN
  INSERT INTO app_garden_viewer__changes (entity_type, entity_id, operation)
  VALUES ('gardens', NEW.id, 'upsert');
END;
CREATE TRIGGER IF NOT EXISTS app_garden_viewer__gardens_change_delete
AFTER DELETE ON app_garden_viewer__gardens BEGIN
  INSERT INTO app_garden_viewer__changes (entity_type, entity_id, operation)
  VALUES ('gardens', OLD.id, 'delete');
END;

CREATE TRIGGER IF NOT EXISTS app_garden_viewer__plants_change_insert
AFTER INSERT ON app_garden_viewer__plants BEGIN
  INSERT INTO app_garden_viewer__changes (entity_type, entity_id, operation)
  VALUES ('plants', NEW.id, 'upsert');
END;
CREATE TRIGGER IF NOT EXISTS app_garden_viewer__plants_change_update
AFTER UPDATE OF garden_id, common_name, scientific_name, plant_type, bed_name,
  notes, photo_urls, lat, lng, added_by_name ON app_garden_viewer__plants BEGIN
  INSERT INTO app_garden_viewer__changes (entity_type, entity_id, operation)
  VALUES ('plants', NEW.id, 'upsert');
END;
CREATE TRIGGER IF NOT EXISTS app_garden_viewer__plants_change_delete
AFTER DELETE ON app_garden_viewer__plants BEGIN
  INSERT INTO app_garden_viewer__changes (entity_type, entity_id, operation)
  VALUES ('plants', OLD.id, 'delete');
END;

CREATE TRIGGER IF NOT EXISTS app_garden_viewer__plant_events_change_insert
AFTER INSERT ON app_garden_viewer__plant_events BEGIN
  INSERT INTO app_garden_viewer__changes (entity_type, entity_id, operation)
  VALUES ('plant_events', NEW.id, 'upsert');
END;
CREATE TRIGGER IF NOT EXISTS app_garden_viewer__plant_events_change_update
AFTER UPDATE ON app_garden_viewer__plant_events BEGIN
  INSERT INTO app_garden_viewer__changes (entity_type, entity_id, operation)
  VALUES ('plant_events', NEW.id, 'upsert');
END;
CREATE TRIGGER IF NOT EXISTS app_garden_viewer__plant_events_change_delete
AFTER DELETE ON app_garden_viewer__plant_events BEGIN
  INSERT INTO app_garden_viewer__changes (entity_type, entity_id, operation)
  VALUES ('plant_events', OLD.id, 'delete');
END;

CREATE TRIGGER IF NOT EXISTS app_garden_viewer__care_reminders_change_insert
AFTER INSERT ON app_garden_viewer__care_reminders BEGIN
  INSERT INTO app_garden_viewer__changes (entity_type, entity_id, operation)
  VALUES ('care_reminders', NEW.id, 'upsert');
END;
CREATE TRIGGER IF NOT EXISTS app_garden_viewer__care_reminders_change_update
AFTER UPDATE OF plant_id, garden_id, reminder_type, frequency_days,
  next_due_date, notes, added_by_name ON app_garden_viewer__care_reminders BEGIN
  INSERT INTO app_garden_viewer__changes (entity_type, entity_id, operation)
  VALUES ('care_reminders', NEW.id, 'upsert');
END;
CREATE TRIGGER IF NOT EXISTS app_garden_viewer__care_reminders_change_delete
AFTER DELETE ON app_garden_viewer__care_reminders BEGIN
  INSERT INTO app_garden_viewer__changes (entity_type, entity_id, operation)
  VALUES ('care_reminders', OLD.id, 'delete');
END;
