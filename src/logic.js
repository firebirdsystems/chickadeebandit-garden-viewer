/**
 * Fields the in-app search matches against (see hub-sdk `searchMatch`). The
 * scientific name is in here because that is what plant labels and nursery
 * receipts carry, and the bed name so a whole bed can be pulled up at once.
 */
export function searchableFields(plant) {
  return [plant.common_name, plant.scientific_name, plant.bed_name, plant.notes];
}
