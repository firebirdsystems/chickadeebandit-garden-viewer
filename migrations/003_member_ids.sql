-- Stable member attribution alongside the display-name snapshots. The ids are
-- household roster member ids (family.members); the *_name columns remain as
-- denormalized fallbacks for members who have since left the household.
ALTER TABLE app_garden_viewer__plants ADD COLUMN added_by_id TEXT;
ALTER TABLE app_garden_viewer__plant_events ADD COLUMN added_by_id TEXT;
ALTER TABLE app_garden_viewer__garden_activity ADD COLUMN actor_id TEXT;
