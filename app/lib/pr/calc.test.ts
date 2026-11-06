import { describe, expect, it } from 'vitest'
import { calcTotals } from './calculator'

describe('calcTotals', () => {
  it('คำนวณ subtotal, vat 7%, total', () => {
    const result = calcTotals([
      { quantity: 2, unitPrice: 50000 },
      { quantity: 1, unitPrice: 100000 }
    ])
    expect(result).toEqual({ subtotal: 200000, vat: 14000, total: 214000 })
  })

  it('vat ปัดเศษ', () => {
    const result = calcTotals([{ quantity: 1, unitPrice: 1050 }])
    expect(result).toEqual({ subtotal: 1050, vat: 74, total: 1124 })
  })

  it('ไม่มีรายการ', () => {
    const result = calcTotals([])
    expect(result).toEqual({ subtotal: 0, vat: 0, total: 0 })
  })
})
