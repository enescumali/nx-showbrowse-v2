import { describe, it, expect, afterEach } from 'vitest';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readSnapshot, writeSnapshot } from './snapshot';
import type { Show } from '../types/show.types';

const sampleShows: Show[] = [
  {
    id: 1,
    title: 'Test Show',
    showType: 'Scripted',
    overview: '',
    posterUrl: '',
    backdropUrl: '',
    releaseDate: '2020-01-01',
    rating: 8,
    genres: ['Drama'],
  },
];

let dir: string;

async function makeTempDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'show-store-snapshot-'));
}

describe('snapshot', () => {
  afterEach(async () => {
    if (dir) await rm(dir, { recursive: true, force: true });
  });

  it('round-trips a written snapshot', async () => {
    dir = await makeTempDir();
    const path = join(dir, 'shows.json');

    await writeSnapshot(path, sampleShows);
    const result = await readSnapshot(path);

    expect(result).toEqual(sampleShows);
  });

  it('creates the parent directory if it does not exist', async () => {
    dir = await makeTempDir();
    const path = join(dir, 'nested', 'shows.json');

    await writeSnapshot(path, sampleShows);

    expect(await readSnapshot(path)).toEqual(sampleShows);
  });

  it('returns null when the file does not exist', async () => {
    dir = await makeTempDir();
    const path = join(dir, 'missing.json');

    expect(await readSnapshot(path)).toBeNull();
  });

  it('returns null for corrupt JSON instead of throwing', async () => {
    dir = await makeTempDir();
    const path = join(dir, 'corrupt.json');
    await writeFile(path, '{ not valid json', 'utf-8');

    expect(await readSnapshot(path)).toBeNull();
  });

  it('returns null when the file contains something other than an array', async () => {
    dir = await makeTempDir();
    const path = join(dir, 'not-array.json');
    await writeFile(path, JSON.stringify({ foo: 'bar' }), 'utf-8');

    expect(await readSnapshot(path)).toBeNull();
  });

  it('does not leave a .tmp file behind after a successful write', async () => {
    dir = await makeTempDir();
    const path = join(dir, 'shows.json');

    await writeSnapshot(path, sampleShows);

    await expect(readFile(`${path}.tmp`, 'utf-8')).rejects.toThrow();
  });
});
