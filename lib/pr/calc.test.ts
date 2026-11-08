import { describe, expect, it } from 'vitest'
import { calcTotals, validateItems } from './calculator'

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

  it('vat ปัดขึ้นที่ .5 สตางค์ (7% ของ 50 สตางค์ = 3.5 -> 4)', () => {
    expect(calcTotals([{ quantity: 1, unitPrice: 50 }]).vat).toBe(4)
  })

  it('vat ปัดลงต่ำกว่า .5 สตางค์ (7% ของ 21 สตางค์ = 1.47 -> 1)', () => {
    expect(calcTotals([{ quantity: 1, unitPrice: 21 }]).vat).toBe(1)
  })

  it('หลายรายการ: ปัดเศษ VAT ที่ยอดรวม ไม่ปัดทีละรายการ', () => {

    const r = calcTotals([
      { quantity: 1, unitPrice: 21 },
      { quantity: 1, unitPrice: 21 },
      { quantity: 1, unitPrice: 21 }
    ])
    expect(r).toEqual({ subtotal: 63, vat: 4, total: 67 })
  })

  it('total = subtotal + vat เสมอ', () => {
    const r = calcTotals([{ quantity: 7, unitPrice: 12345 }])
    expect(r.total).toBe(r.subtotal + r.vat)
  })

  it('ไม่มีรายการ', () => {
    const result = calcTotals([])
    expect(result).toEqual({ subtotal: 0, vat: 0, total: 0 })
  })
})

describe('validateItems', () => {
  it('reject รายการว่าง', () => {
    expect(() => validateItems([])).toThrow()
  })
  it('reject จำนวน 0', () => {
    expect(() =>
      validateItems([{ itemName: 'a', quantity: 0, unitPrice: 1 }])
    ).toThrow()
  })
  it('reject ชื่อสินค้าว่าง', () => {
    expect(() =>
      validateItems([{ itemName: '  ', quantity: 1, unitPrice: 1 }])
    ).toThrow()
  })
  it('reject จำนวนทศนิยม', () => {
    expect(() =>
      validateItems([{ itemName: 'a', quantity: 1.5, unitPrice: 1 }])
    ).toThrow()
  })
  it('reject ราคาติดลบ', () => {
    expect(() =>
      validateItems([{ itemName: 'a', quantity: 1, unitPrice: -1 }])
    ).toThrow()
  })
  it('ผ่านและ trim ชื่อ', () => {
    const result = validateItems([
      { itemName: ' เมาส์ ', quantity: 1, unitPrice: 100 }
    ])
    expect(result).toEqual([{ itemName: 'เมาส์', quantity: 1, unitPrice: 100 }])
  })
})
