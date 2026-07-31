-- `changes` is an append-only sync ledger — one row per edit, forever — and had
-- no retention until the manifest gained retain_days. The hub's retention sweep
-- deletes with `WHERE changed_at < ?`, so without a leading index on that column
-- every nightly prune full-scans the ledger it is meant to keep small.
--
-- Mirrors garden_activity_retention_idx, which does the same job for the sibling
-- garden_activity table under the shared `activity_history` retention control.
CREATE INDEX IF NOT EXISTS changes_retention_idx
  ON app_garden_viewer__changes (changed_at);
