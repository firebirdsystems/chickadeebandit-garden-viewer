-- Deleting a garden removes its journal entries with
-- `DELETE FROM app_garden_viewer__plant_events WHERE garden_id = ?`, and the
-- mobile client's pull-side guards test the same column
-- (`NOT EXISTS (SELECT 1 FROM plant_events WHERE garden_id = ? AND dirty = 1)`).
-- plant_events_plant_idx leads with plant_id, so neither query could use it and
-- both full-scanned the table once per garden deletion.
CREATE INDEX IF NOT EXISTS plant_events_garden_idx
  ON app_garden_viewer__plant_events (garden_id);

-- Note on app_garden_viewer__changes_seq_idx (001_init.sql): `seq` is
-- INTEGER PRIMARY KEY AUTOINCREMENT, i.e. the rowid, so that index duplicates
-- the table's own B-tree and only costs write amplification. It is deliberately
-- NOT dropped here — the hub refuses DROP in app migrations — but it should go
-- if that restriction is ever relaxed.
