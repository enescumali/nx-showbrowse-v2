import type { CatalogSort } from '@show-browse/shows';
import { SORT_VALUES, PAGE_SIZE_OPTIONS, DEFAULT_PAGE_SIZE } from './config';

/** Narrows an arbitrary route-query value down to a known CatalogSort, or
 * '' (default order) if it isn't one. */
export function toSort(value: unknown): CatalogSort | '' {
  return SORT_VALUES.includes(value as CatalogSort)
    ? (value as CatalogSort)
    : '';
}

/** Narrows an arbitrary route-query value down to a known page size,
 * falling back to DEFAULT_PAGE_SIZE otherwise. */
export function toPageSize(value: unknown): number {
  const parsed = Number(value);
  return PAGE_SIZE_OPTIONS.includes(parsed) ? parsed : DEFAULT_PAGE_SIZE;
}
