import {
  medusa,
  mapProduct,
  productFields,
  upstreamError
} from "../../utils/medusa"

export default defineEventHandler(async (event) => {
  setHeader(event, "Cache-Control", "no-store")
  const handle = getRouterParam(event, "handle")
  const { sdk, region } = medusa()
  let products
  try {
    const response = await sdk.store.product.list({
      handle,
      limit: 1,
      region_id: region,
      fields: productFields
    })
    products = response.products
  } catch (error) {
    return upstreamError(error)
  }
  if (!products[0])
    throw createError({ statusCode: 404, statusMessage: "Produktas nerastas" })
  return mapProduct(products[0])
})
