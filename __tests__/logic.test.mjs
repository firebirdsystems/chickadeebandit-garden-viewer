import { describe, it, expect } from 'vitest';
import { filterPlants } from '../src/logic.js';

const PLANTS = [
  { id: '1', common_name: 'Basil', scientific_name: 'Ocimum basilicum', bed_name: 'Herb Bed' },
  { id: '2', common_name: 'Rose', scientific_name: 'Rosa canina', bed_name: 'Front Yard' },
  { id: '3', common_name: 'Tomato', scientific_name: null, bed_name: null },
];

describe('filterPlants', () => {
  it('returns all plants when query is empty string', () => {
    expect(filterPlants(PLANTS, '')).toHaveLength(3);
  });

  it('returns all plants when query is empty (no mutation)', () => {
    const result = filterPlants(PLANTS, '');
    result.push({ id: 'x', common_name: 'X', scientific_name: null, bed_name: null });
    expect(PLANTS).toHaveLength(3);
  });

  it('matches by common_name (case-insensitive)', () => {
    const result = filterPlants(PLANTS, 'BASIL');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('matches by scientific_name', () => {
    const result = filterPlants(PLANTS, 'canina');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('matches by bed_name', () => {
    const result = filterPlants(PLANTS, 'herb');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('handles null scientific_name and bed_name without throwing', () => {
    const result = filterPlants(PLANTS, 'tomato');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('3');
  });

  it('returns empty array when nothing matches', () => {
    expect(filterPlants(PLANTS, 'zzznomatch')).toHaveLength(0);
  });

  it('does not mutate the input array', () => {
    const original = [...PLANTS];
    filterPlants(PLANTS, 'basil');
    expect(PLANTS).toEqual(original);
  });
});
