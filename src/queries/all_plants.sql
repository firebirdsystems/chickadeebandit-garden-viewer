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
FROM app_garden_viewer__plants p
JOIN app_garden_viewer__gardens g
  ON g.id            = p.garden_id
ORDER BY g.name, p.common_name
LIMIT 500
