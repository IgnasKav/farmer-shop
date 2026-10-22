export const orderIdPattern = /^order_[A-Za-z0-9]+$/
export const optionIdPattern = /^so_[A-Za-z0-9]+$/

export interface CheckoutDetails {
  email: string
  firstName: string
  lastName: string
  phone: string
}
export type DetailErrors = Partial<Record<keyof CheckoutDetails, string>>

const text = (value: unknown, max: number) =>
  typeof value === "string"
    ? // eslint-disable-next-line no-control-regex
      value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max + 1)
    : ""

export function validateDetails(body: unknown): {
  values: CheckoutDetails
  errors: DetailErrors
} {
  const input = (body ?? {}) as Record<string, unknown>
  const values: CheckoutDetails = {
    email: text(input.email, 254),
    firstName: text(input.firstName, 80),
    lastName: text(input.lastName, 80),
    phone: text(input.phone, 30)
  }
  const errors: DetailErrors = {}
  if (
    values.email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email)
  )
    errors.email = "Įveskite teisingą el. pašto adresą"
  if (!values.firstName || values.firstName.length > 80)
    errors.firstName = "Įveskite vardą"
  if (!values.lastName || values.lastName.length > 80)
    errors.lastName = "Įveskite pavardę"
  const digits = values.phone.replace(/\D/g, "")
  if (
    !/^\+?[0-9 ()\-]+$/.test(values.phone) ||
    digits.length < 6 ||
    digits.length > 15
  )
    errors.phone = "Įveskite teisingą telefono numerį"
  return { values, errors }
}

export function parseDetails(body: unknown): CheckoutDetails {
  const { values, errors } = validateDetails(body)
  if (Object.keys(errors).length) throw new Error("Invalid details")
  return values
}

export function parseOptionId(body: unknown): string {
  const id = ((body ?? {}) as Record<string, unknown>).optionId
  if (typeof id !== "string" || !optionIdPattern.test(id))
    throw new Error("Invalid option")
  return id
}
