import { User } from '@prisma/client'
import { prisma } from '../prisma'
import { calcTotals, validateItems } from './calculator'
import { AppError } from './error'
import {
  canEdit,
  confirmRole,
  getNextStatus,
  PRAction,
  PRStatus,
  STATUSES
} from './status'

const include = { items: true }

async function findPurchaseRequest(id: number) {
  const pr = await prisma.purchaseRequest.findUnique({ where: { id }, include })
  if (!pr) throw new AppError(404, 'ไม่พบ PR')
  return pr
}

function confirmOwner(user: User, pr: { requesterName: String }) {
  if (user.role !== 'REQUESTER' || pr.requesterName !== user.name) {
    throw new AppError(403, 'เฉพาะผู้ขอที่เป็นเจ้าของ PR เท่านั้น')
  }
}

export async function listPRs(status?: string | null) {
  if (status && !STATUSES.includes(status as PRStatus)) {
    throw new AppError(400, 'status ไม่ถูกต้อง')
  }
  return prisma.purchaseRequest.findMany({
    where: status ? { status } : undefined,
    orderBy: { id: 'desc' }
  })
}

export const getPR = (id: number) => findPurchaseRequest(id)

export async function createPR(user: User, body: { items?: unknown }) {
  confirmRole(user, 'REQUESTER')
  const items = validateItems(body.items)
  const totals = calcTotals(items)

  return prisma.$transaction(async (tx) => {
    const created = await tx.purchaseRequest.create({
      data: {
        prNumber: `TMP-${Date.now()}-${Math.random()}`,
        requesterName: user.name,
        department: user.department,
        ...totals,
        items: { create: items }
      }
    })
    return tx.purchaseRequest.update({
      where: { id: created.id },
      data: { prNumber: `PR-${String(created.id).padStart(5, '0')}` },
      include
    })
  })
}

export async function updatePR(
  user: User,
  id: number,
  body: { items?: unknown }
) {
  const pr = await findPurchaseRequest(id)
  confirmOwner(user, pr)
  if (!canEdit(pr.status as PRStatus)) {
    throw new AppError(409, 'แก้ไขได้เฉพาะ PR ที่เป็น Draft')
  }
  const items = validateItems(body.items)
  return prisma.purchaseRequest.update({
    where: { id },
    data: {
      ...calcTotals(items),
      items: { deleteMany: {}, create: items }
    },
    include
  })
}

export async function deletePR(user: User, id: number) {
  const pr = await findPurchaseRequest(id)
  confirmOwner(user, pr)
  if (!canEdit(pr.status as PRStatus)) {
    throw new AppError(409, 'ลบได้เฉพาะ PR ที่เป็น Draft')
  }
  await prisma.purchaseRequest.delete({ where: { id } })
  return { ok: true }
}

async function transition(
  id: number,
  action: PRAction,
  extra: { rejectReason?: string } = {}
) {
  const pr = await findPurchaseRequest(id)
  const status = getNextStatus(pr.status as PRStatus, action)
  if (status === null) throw new AppError(409, 'ไม่สามารถเปลี่ยนสถานะ PR ได้')
  return prisma.purchaseRequest.update({
    where: { id },
    data: { status, ...extra },
    include
  })
}

export async function submitPR(user: User, id: number) {
  confirmOwner(user, await findPurchaseRequest(id))
  return transition(id, 'SUBMIT')
}

export async function approvePR(user: User, id: number) {
  confirmRole(user, 'APPROVER')
  return transition(id, 'APPROVE')
}

export async function rejectPR(user: User, id: number, reason?: string) {
  confirmRole(user, 'APPROVER')
  if (!reason?.trim()) throw new AppError(400, 'ต้องระบุเหตุผลในการ reject')
  return transition(id, 'REJECT', { rejectReason: reason.trim() })
}
