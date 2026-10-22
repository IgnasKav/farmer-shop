import test from "node:test";
import assert from "node:assert/strict";
import {
  isLineItemId,
  mapCart,
  parseAddItem,
  parseQuantity,
} from "../shared/cart.ts";

test("accepts a valid add-to-cart request and defaults the quantity", () => {
  assert.deepEqual(parseAddItem({ variantId: "variant_01ABC", quantity: 3 }), {
    variantId: "variant_01ABC",
    quantity: 3,
  });
  assert.equal(parseAddItem({ variantId: "variant_01ABC" }).quantity, 1);
});

test("rejects malformed variants and quantities", () => {
  for (const body of [
    null,
    {},
    { variantId: "prod_1", quantity: 1 },
    { variantId: "variant_1/../x", quantity: 1 },
    { variantId: "variant_1", quantity: 0 },
    { variantId: "variant_1", quantity: 100 },
    { variantId: "variant_1", quantity: 1.5 },
    { variantId: "variant_1", quantity: "2" },
  ]) {
    assert.throws(() => parseAddItem(body));
  }
});

test("quantity updates allow zero (remove) only when asked", () => {
  assert.equal(parseQuantity(0, 0), 0);
  assert.throws(() => parseQuantity(0));
  assert.throws(() => parseQuantity(-1, 0));
});

test("only well-formed line item ids are accepted", () => {
  assert.equal(isLineItemId("cali_01ABC"), true);
  for (const id of ["", "cart_1", "cali_", "cali_1/2", undefined])
    assert.equal(isLineItemId(id), false);
});

test("maps a Medusa cart and totals the item count", () => {
  const cart = mapCart({
    id: "cart_1",
    total: 35.98,
    items: [
      {
        id: "cali_1",
        variant_id: "variant_1",
        product_handle: "pilnas-puodas-1",
        title: "1 kg",
        product_title: "Morkos",
        quantity: 2,
        unit_price: 17.99,
        total: 35.98,
      },
    ],
  });
  assert.equal(cart.itemCount, 2);
  assert.equal(cart.total, 35.98);
  assert.equal(cart.items[0].title, "Morkos");
  assert.equal(cart.items[0].thumbnail, null);
});

test("a missing cart maps to an empty one", () => {
  assert.deepEqual(mapCart(null), {
    id: null,
    items: [],
    itemCount: 0,
    total: 0,
  });
});
