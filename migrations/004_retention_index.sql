-- Retention prune scans the garden activity feed by age (created_at); this index lets the
-- daily runner find expired rows without a full-table scan and covers the id it deletes on.
CREATE INDEX IF NOT EXISTS garden_activity_retention_idx ON app_garden_viewer__garden_activity (created_at, id);
