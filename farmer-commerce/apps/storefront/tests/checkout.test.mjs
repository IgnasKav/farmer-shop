import test from "node:test"
import assert from "node:assert/strict"
import {
  parseDetails,
  parseOptionId,
  validateDetails
} from "../shared/checkout.ts"

const valid = {
  email: "jonas@example.lt",
  firstName: "Jonas",
  lastName: "Jonaitis",
  phone: "+370 600 12345"
}

test("accepts valid contact details and trims whitespace", () => {
  assert.deepEqual(parseDetails({ ...valid, firstName: "  Jonas  " }), valid)
})

test("reports an error for each invalid field", () => {
  const { errors } = validateDetails({
    email: "not-an-email",
    firstName: "",
    lastName: "   ",
    phone: "abc"
  })
  assert.deepEqual(Object.keys(errors).sort(), [
    "email",
    "firstName",
    "lastName",
    "phone"
  ])
})

test("rejects oversized and non-string values", () => {
  for (const patch of [
    { firstName: "a".repeat(81) },
    { email: `${"a".repeat(250)}@x.lt` },
    { phone: "1".repeat(16) },
    { phone: "12345" },
    { email: 42 },
    { lastName: null }
  ]) {
    assert.throws(() => parseDetails({ ...valid, ...patch }))
  }
  assert.throws(() => parseDetails(null))
})

test("strips control characters from names", () => {
  assert.equal(
    parseDetails({ ...valid, firstName: "Jo\u0000nas\n" }).firstName,
    "Jonas"
  )
})

test("only well-formed shipping option ids are accepted", () => {
  assert.equal(parseOptionId({ optionId: "so_01ABC" }), "so_01ABC")
  for (const body of [
    null,
    {},
    { optionId: "so_" },
    { optionId: "so_1/../x" },
    { optionId: 5 }
  ]) {
    assert.throws(() => parseOptionId(body))
  }
})
