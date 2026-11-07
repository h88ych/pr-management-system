import { describe, expect, it } from 'vitest'
import { canEdit, getNextStatus } from './status'

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

describe('canEdit', () => {
  it('DRAFT แก้ได้', () => {
    expect(canEdit('DRAFT')).toBe(true)
  })
  it('PENDING แก้ไม่ได้', () => {
    expect(canEdit('PENDING')).toBe(false)
  })
  it('APPROVED, REJECTED แก้ไม่ได้', () => {
    expect(canEdit('APPROVED')).toBe(false)
    expect(canEdit('REJECTED')).toBe(false)
  })
})
