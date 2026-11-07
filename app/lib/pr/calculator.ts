import { AppError } from './error'

export type itemInput = {
  itemName: string
  quantity: number
  unitPrice: number
}

export function calcTotals(items: { quantity: number; unitPrice: number }[]) {
  let subtotal = 0
  for (const item of items) {
    subtotal += item.quantity * item.unitPrice
  }

  const vat = Math.round(subtotal * (7 / 100))
  const total = subtotal + vat

  return { subtotal, vat, total }
}

export function validateItems(items: unknown): itemInput[] {
  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError(400, 'ต้องมีอย่างน้อย 1 รายการ')
  }
  const result: itemInput[] = []
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const n = i + 1
    if (typeof item?.itemName !== 'string' || !item.itemName.trim()) {
      throw new AppError(400, `รายการที่ ${n}: ต้องระบุชื่อสินค้า`)
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new AppError(400, `รายการที่ ${n}: จำนวนต้องเป็นจำนวนเต็มมากกว่า 0`)
    }
    if (!Number.isInteger(item.unitPrice) || item.unitPrice < 0) {
      throw new AppError(400, `รายการที่ ${n}: ราคาต่อหน่วยไม่ถูกต้อง`)
    }

    result.push({
      itemName: item.itemName.trim(),
      quantity: item.quantity,
      unitPrice: item.unitPrice
    })
  }

  return result
}
