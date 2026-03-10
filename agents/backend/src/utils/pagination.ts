export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

export function parsePagination(query: {
  page?: unknown;
  limit?: unknown;
}): PaginationParams {
  const page = Math.max(1, parseInt(String(query.page ?? "1"), 10) || 1);
  const parsedLimit = parseInt(String(query.limit ?? ""), 10);
  const rawLimit = isNaN(parsedLimit) ? 20 : parsedLimit;
  const limit = Math.min(100, Math.max(1, rawLimit));
  return { page, limit };
}

export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  { page, limit }: PaginationParams
): PaginatedResult<T> {
  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    limit,
  };
}

export function getSkip({ page, limit }: PaginationParams): number {
  return (page - 1) * limit;
}
