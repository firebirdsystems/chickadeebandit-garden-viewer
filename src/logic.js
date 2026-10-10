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
