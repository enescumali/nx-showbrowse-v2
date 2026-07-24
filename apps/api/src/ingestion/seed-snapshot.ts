import { readFile } from 'node:fs/promises';
import { gunzip } from 'node:zlib';
import { promisify } from 'node:util';
import type { Show } from '../types/show.types';

const gunzipAsync = promisify(gunzip);

/** A one-time, repo-committed crawl result (apps/api/data/seed-snapshot.json.gz),
 * used only when no live snapshot exists yet. Lets hosts with ephemeral disks
 * (a fresh container on every deploy) start serving instantly instead of
 * re-crawling TVMaze's full index on every cold boot. Missing/corrupt file
 * falls back to null, same convention as readSnapshot. */
export async function readSeedSnapshot(path: string): Promise<Show[] | null> {
  try {
    const compressed = await readFile(path);
    const raw = await gunzipAsync(compressed);
    const parsed: unknown = JSON.parse(raw.toString('utf-8'));
    return Array.isArray(parsed) ? (parsed as Show[]) : null;
  } catch {
    return null;
  }
}
