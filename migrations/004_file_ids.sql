-- Store hub FILE IDS rather than URLs.
--
-- The hub's file-reclaim keys (delete_file_columns, update_file_columns and
-- their list twins) read a declared column and hand its contents to the
-- reclaim outbox, so the column has to hold an id. Holding a URL meant this
-- app could not declare its file columns at all, and every lane that unlinks a
-- photo — removing one from a plant, replacing a garden's floor plan — was
-- reclaiming with a best-effort `files.delete()` fired after the write. When
-- that call was lost, the bytes stayed: the metadata row survives, so the
-- hub's storage reconciler (which only reaps R2 objects with NO metadata row)
-- reads the orphan as live, and it stays billed against the household's cap.
--
-- A URL is also strictly more coupling than an id: it hard-codes the hub's
-- current /run/:appId/api/files/:id routing into stored data.
--
-- The old `photo_urls` / `plan_image_url` columns are left in place, unread.
-- Dropping a column is refused by migration admission (it rewrites the table,
-- which is not safe to replay), so they stay as dead weight rather than being
-- removed. Both keep defaults that satisfy their NOT NULL constraints, so
-- inserts that name only the new columns still succeed.
--
-- No backfill: the catalog has no installed users of this app, and app
-- migrations run OUTSIDE the household codec — writing derived literals here
-- would land plaintext in an encrypted column. Nothing to convert.

ALTER TABLE app_garden_viewer__plants ADD COLUMN photo_file_ids TEXT NOT NULL DEFAULT '[]';
ALTER TABLE app_garden_viewer__gardens ADD COLUMN plan_file_id TEXT;
