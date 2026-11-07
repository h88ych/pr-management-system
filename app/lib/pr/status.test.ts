import { describe, expect, it } from 'vitest'
import { getNextStatus } from './status'

describe('getNextStatus', () => {
  it('DRAFT + SUBMIT -> PENDING', () => {
    expect(getNextStatus('DRAFT', 'SUBMIT')).toBe('PENDING')
  })
  it('PENDING + APPROVE -> APPROVED', () => {
    expect(getNextStatus('PENDING', 'APPROVE')).toBe('APPROVED')
  })
  it('PENDING + REJECT -> REJECTED', () => {
    expect(getNextStatus('PENDING', 'REJECT')).toBe('REJECTED')
  })
  it('อนุมัติ DRAFT ไม่ได้', () => {
    expect(() => getNextStatus('DRAFT', 'APPROVE')).toThrow()
  })
  it('APPROVED เป็นสถานะสุดท้าย', () => {
    expect(() => getNextStatus('APPROVED', 'SUBMIT')).toThrow()
  })
})
