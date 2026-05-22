CREATE TABLE IF NOT EXISTS gardens (
  household_id   UUID NOT NULL DEFAULT current_setting('app.household_id', true)::uuid,
  id             TEXT NOT NULL,
  name           TEXT NOT NULL,
  garden_type    TEXT NOT NULL DEFAULT 'map',
  plan_image_url TEXT,
  created_at     TEXT NOT NULL,
  PRIMARY KEY (household_id, id)
);

CREATE TABLE IF NOT EXISTS plants (
  household_id    UUID NOT NULL DEFAULT current_setting('app.household_id', true)::uuid,
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
  PRIMARY KEY (household_id, id)
);
