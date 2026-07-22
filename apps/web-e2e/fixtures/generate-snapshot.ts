/**
 * Deterministic generator for the e2e fixture snapshot loaded by apps/api
 * during Playwright runs (see playwright.config.ts's SNAPSHOT_PATH). Not
 * run in CI — this documents how shows-snapshot.json was produced and lets
 * it be regenerated if the fixture ever needs to change shape.
 *
 * Run with: npx tsx apps/web-e2e/fixtures/generate-snapshot.ts
 *
 * Layout (600 shows total, one genre each, ids 1..600):
 *   1-300   Drama   (300 shows -> 2 pages at pageSize 250, for Genre.vue pagination coverage)
 *   301-450 Comedy  (150 shows -> 1 page)
 *   451-550 Action  (100 shows -> 1 page)
 *   551-600 Sci-Fi  (50 shows  -> 1 page)
 * Unfiltered: 600 shows -> 3 pages at pageSize 250.
 *
 * Rating and releaseDate both move monotonically with id (rating
 * decreases, date increases), so "sort=rating" and "sort=date" both
 * exactly reverse id order — every page/sort/filter combination used in
 * the e2e specs has an exact, assertable expected result.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface FixtureShow {
  id: number;
  title: string;
  showType: string;
  overview: string;
  posterUrl: string;
  backdropUrl: string;
  releaseDate: string;
  rating: number;
  genres: string[];
}

const TOTAL_SHOWS = 600;
const GENRE_RANGES: { genre: string; from: number; to: number }[] = [
  { genre: 'Drama', from: 1, to: 300 },
  { genre: 'Comedy', from: 301, to: 450 },
  { genre: 'Action', from: 451, to: 550 },
  { genre: 'Sci-Fi', from: 551, to: 600 },
];

function genreForId(id: number): string {
  const range = GENRE_RANGES.find((r) => id >= r.from && id <= r.to);
  if (!range) throw new Error(`No genre range covers id ${id}`);
  return range.genre;
}

function releaseDateForId(id: number): string {
  const base = new Date('2000-01-01T00:00:00.000Z').getTime();
  const date = new Date(base + id * 86_400_000);
  return date.toISOString().slice(0, 10);
}

function ratingForId(id: number): number {
  return Number(((TOTAL_SHOWS + 1 - id) / (TOTAL_SHOWS / 10)).toFixed(1));
}

function titleForId(id: number): string {
  return `Fixture Show ${String(id).padStart(3, '0')}`;
}

const shows: FixtureShow[] = [];
for (let id = 1; id <= TOTAL_SHOWS; id++) {
  shows.push({
    id,
    title: titleForId(id),
    showType: 'Scripted',
    overview: `Overview for fixture show ${id}.`,
    posterUrl: '',
    backdropUrl: '',
    releaseDate: releaseDateForId(id),
    rating: ratingForId(id),
    genres: [genreForId(id)],
  });
}

const outPath = join(import.meta.dirname, 'shows-snapshot.json');
writeFileSync(outPath, JSON.stringify(shows));
console.log(`Wrote ${shows.length} shows to ${outPath}`);
