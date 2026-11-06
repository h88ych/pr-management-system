export function calcTotals(items: { quantity: number; unitPrice: number }[]) {
  let subtotal = 0
  for (const item of items) {
    subtotal += item.quantity * item.unitPrice
  }

  const vat = Math.round(subtotal * (7 / 100))
  const total = subtotal + vat

  return { subtotal, vat, total }
}
