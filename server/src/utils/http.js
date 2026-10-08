export function parsePagination(query) {
  const page = Math.max(1, Number.parseInt(query.page ?? '1', 10) || 1);
  const rawLimit = Number.parseInt(query.limit ?? '20', 10) || 20;
  const limit = Math.min(100, Math.max(1, rawLimit));
  return { page, limit, offset: (page - 1) * limit };
}

export function paginatedResponse(items, total, page, limit) {
  return {
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export function ok(data, meta) {
  return meta ? { data, meta } : { data };
}
