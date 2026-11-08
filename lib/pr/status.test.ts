import { describe, expect, it } from 'vitest'
import { canEdit, confirmRole, getNextStatus, type PRAction, type PRStatus } from './status'

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

describe('การเปลี่ยนสถานะผิดลำดับ', () => {
  const allStatuses: PRStatus[] = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED']
  const allActions: PRAction[] = ['SUBMIT', 'APPROVE', 'REJECT']
  const valid = new Set(['DRAFT:SUBMIT', 'PENDING:APPROVE', 'PENDING:REJECT'])

  for (const status of allStatuses) {
    for (const action of allActions) {
      const ok = valid.has(`${status}:${action}`)
      it(`${status} + ${action} ${ok ? 'ผ่าน' : 'ต้อง error 409'}`, () => {
        if (ok) {
          expect(() => getNextStatus(status, action)).not.toThrow()
        } else {
          expect(() => getNextStatus(status, action)).toThrow(/Invalid action/)
        }
      })
    }
  }

  it('REJECTED เป็นสถานะสุดท้าย ส่งใหม่ไม่ได้', () => {
    expect(() => getNextStatus('REJECTED', 'SUBMIT')).toThrow()
  })
  it('PENDING ส่งซ้ำไม่ได้', () => {
    expect(() => getNextStatus('PENDING', 'SUBMIT')).toThrow()
  })
  it('error ของการเปลี่ยนสถานะผิดลำดับเป็น 409', () => {
    try {
      getNextStatus('DRAFT', 'APPROVE')
    } catch (e) {
      expect((e as { status: number }).status).toBe(409)
    }
  })
})

describe('confirmRole', () => {
  it('role ตรงกันผ่าน', () => {
    expect(() => confirmRole({ role: 'APPROVER' }, 'APPROVER')).not.toThrow()
  })
  it('Requester อนุมัติไม่ได้ (403)', () => {
    expect(() => confirmRole({ role: 'REQUESTER' }, 'APPROVER')).toThrow()
  })
})
