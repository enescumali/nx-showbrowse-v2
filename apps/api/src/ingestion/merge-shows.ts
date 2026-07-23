import type { Show } from '../types/show.types';

/** Per TVMaze's own docs: resume future syncs where the last one left off. */
export function computeResumePage(
  highestKnownShowId: number,
  pageSize = 250,
): number {
  if (!Number.isFinite(highestKnownShowId) || highestKnownShowId <= 0) {
    return 0;
  }
  return Math.floor(highestKnownShowId / pageSize);
}

/** Incoming wins on id collision. Ids are normalized to number — TVMaze
 * always returns numeric ids, but the shared Show type is string | number. */
export function mergeShowsById(existing: Show[], incoming: Show[]): Show[] {
  const byId = new Map<number, Show>();
  for (const show of existing) byId.set(Number(show.id), show);
  for (const show of incoming) byId.set(Number(show.id), show);
  return [...byId.values()];
}
