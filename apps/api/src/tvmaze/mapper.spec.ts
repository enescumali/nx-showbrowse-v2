import { describe, it, expect } from 'vitest';
import {
  mapShowToDomain,
  mapCastMemberToDomain,
  mapShowWithCastToDomain,
} from './mapper';
import type { TvMazeShow, TvMazeShowWithCast, TvMazeCastMember } from './types';

const baseRaw: TvMazeShow = {
  id: 1,
  name: 'Breaking Bad',
  type: 'Scripted',
  genres: ['Drama', 'Crime'],
  status: 'Ended',
  runtime: 47,
  premiered: '2008-01-20',
  image: {
    medium: 'https://example.com/medium.jpg',
    original: 'https://example.com/original.jpg',
  },
  summary: '<p>A high school chemistry teacher.</p>',
  rating: { average: 9.5 },
};

describe('mapShowToDomain', () => {
  it('maps all fields correctly', () => {
    const result = mapShowToDomain(baseRaw);
    expect(result).toEqual({
      id: 1,
      title: 'Breaking Bad',
      showType: 'Scripted',
      overview: 'A high school chemistry teacher.',
      posterUrl: 'https://example.com/medium.jpg',
      backdropUrl: 'https://example.com/original.jpg',
      releaseDate: '2008-01-20',
      rating: 9.5,
      genres: ['Drama', 'Crime'],
    });
  });

  it('strips HTML tags from summary', () => {
    const raw = { ...baseRaw, summary: '<b>Bold</b> and <i>italic</i>' };
    expect(mapShowToDomain(raw).overview).toBe('Bold and italic');
  });

  it('falls back to empty string when summary is null', () => {
    const raw = { ...baseRaw, summary: null };
    expect(mapShowToDomain(raw).overview).toBe('');
  });

  it('falls back to 0 when rating is null', () => {
    const raw = { ...baseRaw, rating: { average: null } };
    expect(mapShowToDomain(raw).rating).toBe(0);
  });

  it('falls back to empty string when image is null', () => {
    const raw = { ...baseRaw, image: null };
    expect(mapShowToDomain(raw).posterUrl).toBe('');
    expect(mapShowToDomain(raw).backdropUrl).toBe('');
  });

  it('falls back to empty string when premiered is null', () => {
    const raw = { ...baseRaw, premiered: null };
    expect(mapShowToDomain(raw).releaseDate).toBe('');
  });

  it('falls back to empty string when type is undefined', () => {
    const raw = { ...baseRaw, type: undefined as unknown as string };
    expect(mapShowToDomain(raw).showType).toBe('');
  });

  it('falls back to empty array when genres is undefined', () => {
    const raw = { ...baseRaw, genres: undefined as unknown as string[] };
    expect(mapShowToDomain(raw).genres).toEqual([]);
  });
});

describe('mapCastMemberToDomain', () => {
  const rawCast: TvMazeCastMember = {
    person: {
      id: 42,
      name: 'Bryan Cranston',
      image: { medium: 'https://example.com/bryan.jpg', original: '' },
    },
    character: { name: 'Walter White', id: 1 },
  };

  it('maps cast member fields correctly', () => {
    expect(mapCastMemberToDomain(rawCast)).toEqual({
      id: 42,
      name: 'Bryan Cranston',
      character: 'Walter White',
      profileUrl: 'https://example.com/bryan.jpg',
    });
  });

  it('falls back to empty string when person image is null', () => {
    const raw: TvMazeCastMember = {
      ...rawCast,
      person: { ...rawCast.person, image: null },
    };
    expect(mapCastMemberToDomain(raw).profileUrl).toBe('');
  });
});

describe('mapShowWithCastToDomain', () => {
  const rawWithCast: TvMazeShowWithCast = {
    ...baseRaw,
    _embedded: {
      cast: [
        {
          person: {
            id: 42,
            name: 'Bryan Cranston',
            image: { medium: 'https://example.com/bryan.jpg', original: '' },
          },
          character: { name: 'Walter White', id: 1 },
        },
      ],
    },
  };

  it('includes all base show fields', () => {
    const result = mapShowWithCastToDomain(rawWithCast);
    expect(result.title).toBe('Breaking Bad');
    expect(result.rating).toBe(9.5);
  });

  it('maps runtime', () => {
    expect(mapShowWithCastToDomain(rawWithCast).runtime).toBe(47);
  });

  it('falls back to 0 when runtime is null', () => {
    const raw = { ...rawWithCast, runtime: null };
    expect(mapShowWithCastToDomain(raw).runtime).toBe(0);
  });

  it('maps cast array', () => {
    const result = mapShowWithCastToDomain(rawWithCast);
    expect(result.cast).toHaveLength(1);
    expect(result.cast[0].name).toBe('Bryan Cranston');
    expect(result.cast[0].character).toBe('Walter White');
  });

  it('falls back to empty cast when _embedded is missing', () => {
    const raw: TvMazeShowWithCast = { ...rawWithCast, _embedded: undefined };
    expect(mapShowWithCastToDomain(raw).cast).toEqual([]);
  });
});
