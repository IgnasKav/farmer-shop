import { catalogState, searchQueries } from "#shared/catalog"
import {
  medusa,
  mapProduct,
  productFields,
  upstreamError
} from "../utils/medusa"
import type { Catalog } from "../../shared/types"

interface SearchResult {
  hits: { id: string }[]
  metadata: { count: number }
  facets?: { category?: { values: { value: string; count: number }[] } }
}
export default defineEventHandler(async (event): Promise<Catalog> => {
  setHeader(event, "Cache-Control", "no-store")
  let state
  try {
    state = catalogState(getQuery(event))
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: "Neteisingi katalogo filtrai arba puslapis."
    })
  }
  const { sdk, region } = medusa()
  try {
    const { results } = await sdk.client.fetch<{ results: SearchResult[] }>(
      "/store/search",
      { method: "POST", body: searchQueries(state) }
    )
    const result = results[0]!
    const facetResult = results[1]!
    const ids = result.hits.map((hit) => hit.id)
    const response = ids.length
      ? await sdk.store.product.list({
          id: ids,
          limit: ids.length,
          region_id: region,
          fields: productFields
        })
      : { products: [] }
    const byId = new Map(response.products.map((p) => [p.id, mapProduct(p)]))
    return {
      products: ids.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : [])),
      count: result.metadata.count,
      total: facetResult.metadata.count,
      categories: facetResult.facets?.category?.values || [],
      page: state.page,
      pages: Math.max(1, Math.ceil(result.metadata.count / 24))
    }
  } catch (error) {
    return upstreamError(error)
  }
})
