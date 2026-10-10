import { describe, it, expect } from 'vitest';
import { searchableFields, parsePhotoThumbs, parsePhotoIds, tilePhotoId, photoThumbsFor, hasPosition } from '../src/logic.js';

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

describe('parsePhotoThumbs', () => {
  it('reads the stored JSON object', () => {
    expect(parsePhotoThumbs('{"p1":"t1","p2":"t2"}')).toEqual({ p1: 't1', p2: 't2' });
  });

  it('takes an already-parsed object and returns a copy', () => {
    const stored = { p1: 't1' };
    const parsed = parsePhotoThumbs(stored);
    expect(parsed).toEqual({ p1: 't1' });
    expect(parsed).not.toBe(stored);
  });

  it('gives an empty map for a row from before the column', () => {
    expect(parsePhotoThumbs('{}')).toEqual({});
    expect(parsePhotoThumbs(undefined)).toEqual({});
    expect(parsePhotoThumbs(null)).toEqual({});
    expect(parsePhotoThumbs('')).toEqual({});
  });

  it('gives an empty map for a value that is not a JSON object', () => {
    expect(parsePhotoThumbs('{not json')).toEqual({});
    expect(parsePhotoThumbs('["t1"]')).toEqual({});
    expect(parsePhotoThumbs('"t1"')).toEqual({});
    expect(parsePhotoThumbs('null')).toEqual({});
    expect(parsePhotoThumbs(7)).toEqual({});
    expect(parsePhotoThumbs(['t1'])).toEqual({});
  });

  it('drops entries whose small copy is not a file id', () => {
    expect(parsePhotoThumbs('{"p1":"t1","p2":null,"p3":5,"p4":{"id":"t4"},"p5":""}')).toEqual({ p1: 't1' });
  });
});

describe('tilePhotoId', () => {
  it('draws the small copy when the photo has one', () => {
    expect(tilePhotoId('p1', { p1: 't1' })).toBe('t1');
    expect(tilePhotoId('p1', '{"p1":"t1"}')).toBe('t1');
  });

  it('draws the photo itself when it has no small copy', () => {
    expect(tilePhotoId('p2', { p1: 't1' })).toBe('p2');
  });

  it('draws the photo itself for a row from before the column', () => {
    expect(tilePhotoId('p1', '{}')).toBe('p1');
    expect(tilePhotoId('p1', undefined)).toBe('p1');
  });

  it('draws the photo itself when the stored map cannot be read', () => {
    expect(tilePhotoId('p1', '{not json')).toBe('p1');
  });

  it('does not mistake an inherited property for an entry', () => {
    expect(tilePhotoId('constructor', {})).toBe('constructor');
  });
});

describe('photoThumbsFor', () => {
  it('keeps the small copies of the photos in the list', () => {
    expect(photoThumbsFor(['p1', 'p2'], { p1: 't1', p2: 't2' })).toEqual({ p1: 't1', p2: 't2' });
  });

  it('drops the entry of a photo removed from the list', () => {
    expect(photoThumbsFor(['p2'], { p1: 't1', p2: 't2' })).toEqual({ p2: 't2' });
    expect(photoThumbsFor([], { p1: 't1' })).toEqual({});
  });

  it('leaves a photo with no small copy without an entry', () => {
    expect(photoThumbsFor(['p1', 'p2'], { p1: 't1' })).toEqual({ p1: 't1' });
  });

  it('gives an empty map for a row from before the column', () => {
    expect(photoThumbsFor(['p1'], '{}')).toEqual({});
    expect(photoThumbsFor(['p1'], undefined)).toEqual({});
  });

  it('gives an empty map when the stored map cannot be read', () => {
    expect(photoThumbsFor(['p1'], '{not json')).toEqual({});
  });
});

describe('parsePhotoIds', () => {
  it('reads the stored JSON list', () => {
    expect(parsePhotoIds('["a","b"]')).toEqual(['a', 'b']);
  });

  it('gives an empty list for a value that is missing, unreadable, or not a list', () => {
    expect(parsePhotoIds(null)).toEqual([]);
    expect(parsePhotoIds('')).toEqual([]);
    expect(parsePhotoIds('not json')).toEqual([]);
    expect(parsePhotoIds('{"a":"b"}')).toEqual([]);
    expect(parsePhotoIds('"a"')).toEqual([]);
  });

  it('drops entries that are not file ids', () => {
    expect(parsePhotoIds('["a", 3, null, ""]')).toEqual(['a']);
  });
});

describe('hasPosition', () => {
  it('is true for numeric coordinates, zero included', () => {
    expect(hasPosition({ lat: 40.1, lng: -105.2 })).toBe(true);
    expect(hasPosition({ lat: 0, lng: 0 })).toBe(true);
    expect(hasPosition({ lat: '0.25', lng: '0.5' })).toBe(true);
  });

  it('is false for an unplaced plant', () => {
    expect(hasPosition({ lat: null, lng: null })).toBe(false);
    expect(hasPosition({ lat: '', lng: '' })).toBe(false);
    expect(hasPosition({ lat: 1 })).toBe(false);
  });

  it('is false for a coordinate that is not a number', () => {
    expect(hasPosition({ lat: 'north', lng: 3 })).toBe(false);
  });
});
