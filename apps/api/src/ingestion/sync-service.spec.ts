import { describe, it, expect, vi, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createSyncService } from './sync-service';
import { createShowStore } from '../store/show-store';
import { readSnapshot } from './snapshot';
import type { IShowApiClient, Show } from '@show-browse/shows';
import type { RateLimiter } from './rate-limiter';

function rawShow(id: number) {
  return {
    id,
    name: `Show ${id}`,
    type: 'Scripted',
    genres: ['Drama'],
    status: 'Running',
    runtime: 30,
    premiered: '2020-01-01',
    image: null,
    summary: null,
    rating: { average: 7 },
  };
}

function domainShow(id: number | string, overrides: Partial<Show> = {}): Show {
  return {
    id,
    title: `Existing ${id}`,
    showType: '',
    overview: '',
    posterUrl: '',
    backdropUrl: '',
    releaseDate: '',
    rating: 1,
    genres: [],
    ...overrides,
  };
}

function createMockApiClient(
  overrides: Partial<IShowApiClient> = {},
): IShowApiClient {
  return {
    getShows: vi.fn().mockResolvedValue([]),
    getShowById: vi.fn(),
    searchShows: vi.fn().mockResolvedValue([]),
    getSchedule: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

const passthroughRateLimiter: RateLimiter = { schedule: (fn) => fn() };

let dir = '';

afterEach(async () => {
  if (dir) await rm(dir, { recursive: true, force: true });
  dir = '';
});

async function makeSnapshotPath(): Promise<string> {
  dir = await mkdtemp(join(tmpdir(), 'sync-service-'));
  return join(dir, 'shows.json');
}

describe('createSyncService', () => {
  it('runFullCrawl populates the store and writes a snapshot', async () => {
    const getShows = vi.fn((page: number) =>
      page === 0
        ? Promise.resolve([rawShow(1), rawShow(2)])
        : Promise.reject(new Error('[404] Not Found')),
    );
    const store = createShowStore();
    const snapshotPath = await makeSnapshotPath();
    const sync = createSyncService({
      apiClient: createMockApiClient({ getShows }),
      rateLimiter: passthroughRateLimiter,
      store,
      snapshotPath,
    });

    await sync.runFullCrawl();

    expect(store.getAll().map((s) => s.id)).toEqual([1, 2]);
    expect(store.getMeta().ready).toBe(true);
    expect(await readSnapshot(snapshotPath)).toEqual(store.getAll());
  });

  it("runIncrementalSync resumes from the store's highest known id and merges results", async () => {
    const store = createShowStore();
    store.replace([domainShow(1)]); // highestKnownShowId = 1 -> computeResumePage = 0
    const getShows = vi.fn((page: number) =>
      page === 0
        ? Promise.resolve([rawShow(1), rawShow(2)])
        : Promise.reject(new Error('[404] Not Found')),
    );
    const snapshotPath = await makeSnapshotPath();
    const sync = createSyncService({
      apiClient: createMockApiClient({ getShows }),
      rateLimiter: passthroughRateLimiter,
      store,
      snapshotPath,
    });

    await sync.runIncrementalSync();

    const ids = store
      .getAll()
      .map((s) => Number(s.id))
      .sort((a, b) => a - b);
    expect(ids).toEqual([1, 2]);
    // incoming wins on collision — id 1's title should now be the crawled one
    expect(store.getAll().find((s) => Number(s.id) === 1)?.title).toBe(
      'Show 1',
    );
  });

  it('refresh() picks a full crawl when the store is empty', async () => {
    const getShows = vi.fn((page: number) =>
      page === 0
        ? Promise.resolve([rawShow(1)])
        : Promise.reject(new Error('[404] Not Found')),
    );
    const store = createShowStore();
    const snapshotPath = await makeSnapshotPath();
    const sync = createSyncService({
      apiClient: createMockApiClient({ getShows }),
      rateLimiter: passthroughRateLimiter,
      store,
      snapshotPath,
    });

    const result = sync.refresh();
    expect(result).toEqual({ started: true, status: 'crawling' });

    await vi.waitFor(() => expect(sync.getStatus()).toBe('idle'));
    expect(store.getMeta().ready).toBe(true);
    expect(store.getAll().map((s) => s.id)).toEqual([1]);
  });

  it('refresh() returns started:false while a run is already in flight, and does not double-fetch', async () => {
    let releasePage0!: () => void;
    const page0Promise = new Promise<never[]>((resolve) => {
      releasePage0 = () => resolve([]);
    });
    const getShows = vi.fn((page: number) =>
      page === 0 ? page0Promise : Promise.reject(new Error('[404] Not Found')),
    );
    const store = createShowStore();
    const snapshotPath = await makeSnapshotPath();
    const sync = createSyncService({
      apiClient: createMockApiClient({ getShows }),
      rateLimiter: passthroughRateLimiter,
      store,
      snapshotPath,
    });

    const first = sync.refresh();
    const second = sync.refresh();

    expect(first).toEqual({ started: true, status: 'crawling' });
    expect(second).toEqual({ started: false, status: 'crawling' });
    expect(getShows).toHaveBeenCalledTimes(1);

    releasePage0();
    await vi.waitFor(() => expect(sync.getStatus()).toBe('idle'));
  });

  it('refresh() sets status to error and leaves the store untouched when the crawl fails', async () => {
    const getShows = vi.fn().mockRejectedValue(new Error('[500] boom'));
    const store = createShowStore();
    const snapshotPath = await makeSnapshotPath();
    const sync = createSyncService({
      apiClient: createMockApiClient({ getShows }),
      rateLimiter: passthroughRateLimiter,
      store,
      snapshotPath,
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    sync.refresh();
    await vi.waitFor(() => expect(sync.getStatus()).toBe('error'));

    expect(store.getMeta().ready).toBe(false);
    errorSpy.mockRestore();
  });
});
