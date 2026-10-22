import test from "node:test"
import assert from "node:assert/strict"
import { catalogState, searchQueries } from "../shared/catalog.ts"

test("price sorting happens before bounded pagination, with a stable tie breaker", () => {
  const query = searchQueries(
    catalogState({
      page: "3",
      sort: "price-desc",
      category: "Sūriai",
      q: "sūris"
    })
  ).queries[0]
  assert.deepEqual(query.pagination, {
    skip: 48,
    take: 24,
    order: { min_price_eur: "DESC", id: "ASC" }
  })
  assert.equal(query.filters.category, "Sūriai")
  assert.equal(query.filters.q, "sūris")
})
test("category facets retain other choices while a category is selected", () => {
  const queries = searchQueries(
    catalogState({ category: "Medus", q: "medus" })
  ).queries
  assert.equal(queries[1].filters.category, undefined)
  assert.equal(queries[1].filters.q, "medus")
  assert.equal(queries[1].pagination.take, 0)
})
test("rejects unsupported sorts and malformed pages", () => {
  for (const query of [
    { sort: "newest" },
    { page: "-1" },
    { page: "1.5" },
    { page: "hello" },
    { page: "10001" }
  ]) {
    assert.throws(() => catalogState(query))
  }
  assert.equal(catalogState({}).sort, "price-asc")
})
