import { describe, it, expect, afterEach } from 'vitest';
import { gzip } from 'node:zlib';
import { promisify } from 'node:util';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readSeedSnapshot } from './seed-snapshot';
import type { Show } from '../types/show.types';

const gzipAsync = promisify(gzip);

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
  return mkdtemp(join(tmpdir(), 'seed-snapshot-'));
}

describe('readSeedSnapshot', () => {
  afterEach(async () => {
    if (dir) await rm(dir, { recursive: true, force: true });
  });

  it('reads a gzip-compressed snapshot', async () => {
    dir = await makeTempDir();
    const path = join(dir, 'seed.json.gz');
    const compressed = await gzipAsync(JSON.stringify(sampleShows));
    await writeFile(path, compressed);

    expect(await readSeedSnapshot(path)).toEqual(sampleShows);
  });

  it('returns null when the file does not exist', async () => {
    dir = await makeTempDir();
    const path = join(dir, 'missing.json.gz');

    expect(await readSeedSnapshot(path)).toBeNull();
  });

  it('returns null for a file that is not valid gzip', async () => {
    dir = await makeTempDir();
    const path = join(dir, 'not-gzip.json.gz');
    await writeFile(path, 'not actually gzip');

    expect(await readSeedSnapshot(path)).toBeNull();
  });

  it('returns null when the decompressed content is not an array', async () => {
    dir = await makeTempDir();
    const path = join(dir, 'not-array.json.gz');
    const compressed = await gzipAsync(JSON.stringify({ foo: 'bar' }));
    await writeFile(path, compressed);

    expect(await readSeedSnapshot(path)).toBeNull();
  });
});
