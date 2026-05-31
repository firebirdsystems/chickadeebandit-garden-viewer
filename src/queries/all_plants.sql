SELECT
  p.id,
  p.common_name,
  p.scientific_name,
  p.plant_type,
  p.bed_name,
  p.notes,
  p.added_by_name,
  p.created_at,
  g.name AS garden_name,
  g.garden_type
FROM plants p
JOIN gardens g
  ON g.id            = p.garden_id
  AND g.household_id = p.household_id
WHERE p.household_id = current_setting('app.household_id', true)::uuid
ORDER BY g.name, p.common_name
LIMIT 500
