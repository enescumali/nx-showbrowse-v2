import { z } from 'zod';

// Mirrors types/show.types.ts and bff-api-client.interface.ts exactly —
// validated at the one place a wire-format boundary actually exists for
// this package: apps/api's HTTP responses. See bff-api.client.ts.

export const showSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string(),
  showType: z.string(),
  overview: z.string(),
  posterUrl: z.string(),
  backdropUrl: z.string(),
  releaseDate: z.string(),
  rating: z.number(),
  genres: z.array(z.string()),
});

export const castMemberSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
  character: z.string(),
  profileUrl: z.string(),
});

export const showDetailSchema = showSchema.extend({
  runtime: z.number(),
  cast: z.array(castMemberSchema),
});

export const catalogPageSchema = z.object({
  shows: z.array(showSchema),
  page: z.number(),
  pageSize: z.number(),
  totalShows: z.number(),
  totalPages: z.number(),
});

export const genreGroupSchema = z.object({
  genre: z.string(),
  shows: z.array(showSchema),
});

export const genreSummarySchema = z.object({
  genre: z.string(),
  count: z.number(),
});

export const showListSchema = z.array(showSchema);
export const genreGroupListSchema = z.array(genreGroupSchema);
export const genreSummaryListSchema = z.array(genreSummarySchema);
