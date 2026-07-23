import { describe, it, expect } from 'vitest';
import { computeResumePage, mergeShowsById } from './merge-shows';
import type { Show } from '../types/show.types';

function show(id: number | string, overrides: Partial<Show> = {}): Show {
  return {
    id,
    title: `Show ${id}`,
    showType: 'Scripted',
    overview: '',
    posterUrl: '',
    backdropUrl: '',
    releaseDate: '',
    rating: 0,
    genres: [],
    ...overrides,
  };
}

describe('computeResumePage', () => {
  it('returns 0 for a non-positive or non-finite highestKnownShowId', () => {
    expect(computeResumePage(0)).toBe(0);
    expect(computeResumePage(-5)).toBe(0);
    expect(computeResumePage(NaN)).toBe(0);
  });

  it('floors highestKnownShowId / pageSize', () => {
    expect(computeResumePage(1800, 250)).toBe(7);
    expect(computeResumePage(250, 250)).toBe(1);
    expect(computeResumePage(249, 250)).toBe(0);
  });

  it('defaults pageSize to 250', () => {
    expect(computeResumePage(1800)).toBe(7);
  });
});

describe('mergeShowsById', () => {
  it('combines two disjoint lists', () => {
    const result = mergeShowsById([show(1)], [show(2)]);
    expect(result.map((s) => s.id).sort()).toEqual([1, 2]);
  });

  it('incoming wins on id collision', () => {
    const result = mergeShowsById(
      [show(1, { title: 'Old title' })],
      [show(1, { title: 'New title' })],
    );
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('New title');
  });

  it('normalizes string/number id collisions to the same entry', () => {
    const result = mergeShowsById([show(1)], [show('1')]);
    expect(result).toHaveLength(1);
  });
});
