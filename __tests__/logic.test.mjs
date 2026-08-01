import { describe, it, expect } from 'vitest';
import { searchableFields } from '../src/logic.js';

const PLANTS = [
  { id: '1', common_name: 'Basil', scientific_name: 'Ocimum basilicum', bed_name: 'Herb Bed' },
  { id: '2', common_name: 'Rose', scientific_name: 'Rosa canina', bed_name: 'Front Yard' },
  { id: '3', common_name: 'Tomato', scientific_name: null, bed_name: null },
];

describe('searchableFields', () => {
  it('offers the scientific name, which is what plant labels carry', () => {
    expect(searchableFields(PLANTS[1])).toContain('Rosa canina');
  });

  it('offers the bed name, so a whole bed can be pulled up at once', () => {
    expect(searchableFields(PLANTS[0])).toContain('Herb Bed');
  });

  it('tolerates the null columns a sparse plant row carries', () => {
    // The shared matcher skips null/undefined fields, so they are safe to emit.
    expect(searchableFields(PLANTS[2])).toEqual(['Tomato', null, null, undefined]);
  });
});
