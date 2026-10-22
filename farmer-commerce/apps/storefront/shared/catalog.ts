export const PAGE_SIZE = 24
export function catalogState(query: Record<string, unknown>) {
  const first = (value: unknown) => (Array.isArray(value) ? value[0] : value)
  const rawPage = String(first(query.page) ?? "1")
  const page = Number(rawPage)
  if (
    !/^\d+$/.test(rawPage) ||
    !Number.isSafeInteger(page) ||
    page < 1 ||
    page > 10000
  ) {
    throw new Error("Invalid page")
  }
  const sort = String(first(query.sort) ?? "price-asc")
  if (!["price-asc", "price-desc"].includes(sort))
    throw new Error("Invalid sort")
  return {
    page,
    sort,
    q: String(first(query.q) ?? "")
      .trim()
      .slice(0, 120),
    category: String(first(query.category) ?? "")
      .trim()
      .slice(0, 150)
  }
}
export function searchQueries(state: ReturnType<typeof catalogState>) {
  const baseFilters = {
    min_price_eur: { $exists: true },
    ...(state.q ? { q: state.q } : {})
  }
  return {
    queries: [
      {
        entity: "product",
        fields: ["id"],
        filters: {
          ...baseFilters,
          ...(state.category ? { category: state.category } : {})
        },
        pagination: {
          skip: (state.page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
          order: {
            min_price_eur: state.sort === "price-desc" ? "DESC" : "ASC",
            id: "ASC"
          }
        },
        search_options: {
          count: "exact",
          attributes_to_search_on: ["title"],
          match_strategy: "last",
          typo_tolerance: true
        }
      },
      {
        entity: "product",
        fields: ["id"],
        filters: baseFilters,
        pagination: { take: 0 },
        search_options: {
          count: "exact",
          facets: [{ field: "category", limit: 200, sort: "alpha" }],
          attributes_to_search_on: ["title"],
          match_strategy: "last",
          typo_tolerance: true
        }
      }
    ]
  }
}
