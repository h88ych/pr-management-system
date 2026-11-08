import { PrismaClient } from '@prisma/client/edge';
import { calcTotals } from '../lib/pr/calculator'

const prisma = new PrismaClient()

type SeedItem = { itemName: string; quantity: number; unitPrice: number }

async function createPR(
  requester: { name: string; department: string },
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED',
  items: SeedItem[],
  rejectReason?: string
) {
  const created = await prisma.purchaseRequest.create({
    data: {
      prNumber: `TMP-${Date.now()}-${Math.random()}`,
      requesterName: requester.name,
      department: requester.department,
      status,
      rejectReason: rejectReason ?? null,
      ...calcTotals(items),
      items: { create: items }
    }
  })
  await prisma.purchaseRequest.update({
    where: { id: created.id },
    data: { prNumber: `PR-${String(created.id).padStart(5, '0')}` }
  })
}

async function main() {
  // ล้างข้อมูลเดิมแล้วสร้างใหม่ รัน seed ซ้ำได้โดยข้อมูลไม่ซ้ำซ้อน
  await prisma.purchaseRequestItem.deleteMany()
  await prisma.purchaseRequest.deleteMany()
  await prisma.user.deleteMany()

  const somchai = { name: 'สมชาย ใจดี', department: 'IT' }
  const somying = { name: 'สมหญิง รักงาน', department: 'Marketing' }

  await prisma.user.createMany({
    data: [
      { ...somchai, role: 'REQUESTER' },
      { ...somying, role: 'REQUESTER' },
      { name: 'วิชัย อนุมัติ', role: 'APPROVER', department: 'Management' }
    ]
  })

  await createPR(somchai, 'DRAFT', [
    { itemName: 'เมาส์ไร้สาย', quantity: 5, unitPrice: 45000 },
    { itemName: 'คีย์บอร์ด', quantity: 5, unitPrice: 89000 }
  ])
  await createPR(somchai, 'PENDING', [
    { itemName: 'จอมอนิเตอร์ 27 นิ้ว', quantity: 2, unitPrice: 750000 }
  ])
  await createPR(somying, 'APPROVED', [
    { itemName: 'ค่าโฆษณา Facebook', quantity: 1, unitPrice: 1500000 },
    { itemName: 'ป้ายโปรโมชั่น', quantity: 10, unitPrice: 35000 }
  ])
  await createPR(
    somying,
    'REJECTED',
    [{ itemName: 'กล้อง DSLR', quantity: 1, unitPrice: 3500000 }],
    'เกินงบประมาณไตรมาสนี้'
  )

  console.log('seed เสร็จ: ผู้ใช้ 3 คน, PR ตัวอย่าง 4 ใบ (ทุกสถานะ)')
}

main().finally(() => prisma.$disconnect())
