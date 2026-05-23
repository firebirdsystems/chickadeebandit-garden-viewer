/**
 * @param {object[]} plants
 * @param {string} query  already lowercased
 */
export function filterPlants(plants, query) {
  if (!query) return [...plants];
  const q = query.toLowerCase();
  return plants.filter(p =>
    p.common_name.toLowerCase().includes(q) ||
    (p.scientific_name || '').toLowerCase().includes(q) ||
    (p.bed_name || '').toLowerCase().includes(q)
  );
}
