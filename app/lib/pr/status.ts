import { AppError } from './error'

export type PRStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED'
export type PRAction = 'SUBMIT' | 'APPROVE' | 'REJECT'
export type Role = 'REQUESTER' | 'APPROVER'

const transitions: Record<PRStatus, Partial<Record<PRAction, PRStatus>>> = {
  DRAFT: { SUBMIT: 'PENDING' },
  PENDING: { APPROVE: 'APPROVED', REJECT: 'REJECTED' },
  APPROVED: {},
  REJECTED: {}
}

export function getNextStatus(
  currentStatus: PRStatus,
  action: PRAction
): PRStatus | null {
  const nextStatus = transitions[currentStatus]?.[action]
  if (!nextStatus) {
    throw new AppError(
      400,
      `Invalid action '${action}' for status '${currentStatus}'`
    )
  }
  return nextStatus ?? null
}

export function canEdit(status: PRStatus): boolean {
  return status === 'DRAFT'
}

export function confirmRole(user: { role: string }, requiredRole: Role): void {
  if (user.role !== requiredRole) {
    throw new AppError(403, `ต้องเป็น ${requiredRole} เท่านั้น`)
  }
}
