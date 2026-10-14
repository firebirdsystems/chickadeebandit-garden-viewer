/**
 * Fields the in-app search matches against (see hub-sdk `searchMatch`). The
 * scientific name is in here because that is what plant labels and nursery
 * receipts carry, and the bed name so a whole bed can be pulled up at once.
 */
export function searchableFields(plant) {
  return [plant.common_name, plant.scientific_name, plant.bed_name, plant.notes];
}

/**
 * A plant's `photo_thumbs` column as a plain object: photo file id → the file
 * id of that photo's small copy. The column arrives as JSON text; a row from
 * before the column, or one whose value cannot be read, gives `{}`, which
 * simply draws every photo from its own file.
 */
export function parsePhotoThumbs(raw) {
  let map = raw;
  if (typeof raw === 'string') {
    try { map = JSON.parse(raw); } catch { return {}; }
  }
  if (!map || typeof map !== 'object' || Array.isArray(map)) return {};
  const out = {};
  for (const [photoId, thumbId] of Object.entries(map)) {
    if (typeof thumbId === 'string' && thumbId) out[photoId] = thumbId;
  }
  return out;
}

/**
 * The file to draw for a photo at thumbnail size: its small copy when one was
 * kept, otherwise the photo itself. An upload keeps no small copy when the
 * photo is already small or the browser cannot draw its format.
 */
export function tilePhotoId(photoId, thumbs) {
  const known = parsePhotoThumbs(thumbs);
  return Object.hasOwn(known, photoId) ? known[photoId] : photoId;
}

/**
 * The `photo_thumbs` value to store beside a photo list: the known small
 * copies, cut down to the photos still in the list. Removing a photo therefore
 * drops its entry in the same write.
 */
export function photoThumbsFor(photoIds, thumbs) {
  const known = parsePhotoThumbs(thumbs);
  const out = {};
  for (const photoId of photoIds) {
    if (Object.hasOwn(known, photoId)) out[photoId] = known[photoId];
  }
  return out;
}

/**
 * A plant's `photo_file_ids` column as a list of file ids. The column arrives
 * as JSON text; a value that cannot be read, or is not a list, gives `[]`, so
 * one bad row shows a plant without photos and not an empty garden.
 */
export function parsePhotoIds(raw) {
  let list = raw;
  if (typeof raw === 'string') {
    try { list = JSON.parse(raw || '[]'); } catch { return []; }
  }
  if (!Array.isArray(list)) return [];
  return list.filter(id => typeof id === 'string' && id);
}

/**
 * Whether a plant has a position that can be drawn. `lat`/`lng` are REAL
 * columns, which keep a non-numeric value as text, and an unplaced plant has
 * nulls: neither may reach the map as a coordinate.
 */
export function hasPosition(plant) {
  const usable = v => v != null && v !== '' && Number.isFinite(Number(v));
  return usable(plant.lat) && usable(plant.lng);
}

/**
 * The line a failed write shows ("Refused, gone, or failed" in the app-template guide):
 * "try again" only when retrying can work. `thing` and `action` are the app's own nouns
 * ("photo", "add the photo"). `found` is the caller's re-read after a write that changed
 * nothing (or a 404/409): false = the row is gone, true = it is still there and the hub
 * narrowed the write away from this member. A `forUser` error keeps the message the page
 * wrote for it. Never shows hub text.
 */
export function failureLine(e, { action, thing, found } = {}) {
  if (e?.forUser) return e.message;
  if (e?.code === "UNIQUE_CONSTRAINT" || /UNIQUE constraint failed/i.test(String(e?.message ?? ""))) return `That ${thing} already exists.`;
  if (e?.status === 403) return `You don’t have permission to ${action}.`;
  if (e?.status === 507) return "The household’s storage is full — free up space first.";
  if (found === false || (found === undefined && e?.status === 404)) return `This ${thing} has been removed.`;
  if (found === true) return `You don’t have permission to ${action}.`;
  if (e?.status === 409 || e?.status === 404) return `This ${thing} was changed by someone else — check it first.`;
  if (e?.status === 429) return "Too many tries — wait a minute and try again.";
  return `Couldn’t ${action} — try again.`;
}

/**
 * The line a failed upload (POST /api/files) shows. The hub's two refusals of the file
 * itself get a line of their own: 413 too large, 415 a type it does not take (or content
 * that does not match the type). The rest — 403 a write ACL, 429 its rate limit, 507
 * storage full, no answer or a 5xx — follows `failureLine`.
 */
export function uploadFailureLine(e, words) {
  if (e?.status === 413) return "That file is too large.";
  if (e?.status === 415) return "That kind of file can’t be uploaded.";
  return failureLine(e, words);
}
