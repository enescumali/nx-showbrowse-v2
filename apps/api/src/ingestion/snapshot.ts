import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { Show } from '@show-browse/shows';

/** Write-then-rename so a crash mid-write never leaves a half-written
 * snapshot for the next boot to trip over. */
export async function writeSnapshot(path: string, shows: Show[]): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const tmpPath = `${path}.tmp`;
  await writeFile(tmpPath, JSON.stringify(shows), 'utf-8');
  await rename(tmpPath, path);
}

/** Missing file, corrupt JSON, or an unexpected shape all fall back to
 * null rather than throwing — the caller falls back to a full crawl. */
export async function readSnapshot(path: string): Promise<Show[] | null> {
  try {
    const raw = await readFile(path, 'utf-8');
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Show[]) : null;
  } catch {
    return null;
  }
}
