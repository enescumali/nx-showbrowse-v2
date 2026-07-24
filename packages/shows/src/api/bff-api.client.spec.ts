import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBFFApiClient } from './bff-api.client';

const BASE_URL = 'http://localhost:4300';

const validShow = {
  id: 1,
  title: 'Breaking Bad',
  showType: 'Scripted',
  overview: 'A chemistry teacher turns to crime.',
  posterUrl: '',
  backdropUrl: '',
  releaseDate: '2008-01-20',
  rating: 9.5,
  genres: ['Drama'],
};

const validShowDetail = { ...validShow, runtime: 47, cast: [] };

function mockFetchOnce(body: unknown, ok = true, statusText = 'OK') {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      status: ok ? 200 : 500,
      statusText,
      json: () => Promise.resolve(body),
    }),
  );
}

describe('createBFFApiClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns validated data for a well-formed show detail response', async () => {
    mockFetchOnce(validShowDetail);
    const client = createBFFApiClient(BASE_URL);

    const result = await client.getShowById(1);

    expect(result).toEqual(validShowDetail);
  });

  it('throws a clear error when a required field is missing', async () => {
    const { rating, ...missingRating } = validShowDetail;
    void rating;
    mockFetchOnce(missingRating);
    const client = createBFFApiClient(BASE_URL);

    await expect(client.getShowById(1)).rejects.toThrow(
      /Unexpected response shape from \/shows\/1/,
    );
  });

  it('throws when a field has the wrong type', async () => {
    mockFetchOnce({ ...validShowDetail, rating: '9.5' });
    const client = createBFFApiClient(BASE_URL);

    await expect(client.getShowById(1)).rejects.toThrow(
      /Unexpected response shape/,
    );
  });

  it('validates every item in a list response, not just the first', async () => {
    mockFetchOnce([validShow, { ...validShow, genres: 'not-an-array' }]);
    const client = createBFFApiClient(BASE_URL);

    await expect(client.searchShows('batman')).rejects.toThrow(
      /Unexpected response shape from \/search/,
    );
  });

  it('passes through a well-formed list response unchanged', async () => {
    mockFetchOnce([validShow]);
    const client = createBFFApiClient(BASE_URL);

    const result = await client.searchShows('breaking');

    expect(result).toEqual([validShow]);
  });

  it('still surfaces the server error message for a non-ok response', async () => {
    mockFetchOnce({ error: 'Show not found' }, false, 'Not Found');
    const client = createBFFApiClient(BASE_URL);

    await expect(client.getShowById(999)).rejects.toThrow(
      '[500] Show not found',
    );
  });

  it('still surfaces a connection error when fetch itself rejects', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('network down')),
    );
    const client = createBFFApiClient(BASE_URL);

    await expect(client.getShowById(1)).rejects.toThrow(
      'Unable to connect. Check your internet connection.',
    );
  });
});
