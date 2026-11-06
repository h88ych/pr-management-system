import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.user.deleteMany()
  await prisma.user.createMany({
    data: [
      { name: 'สมชาย ใจดี', role: 'REQUESTER', department: 'IT' },
      { name: 'สมหญิง รักงาน', role: 'REQUESTER', department: 'Marketing' },
      { name: 'วิชัย อนุมัติ', role: 'APPROVER', department: 'Management' }
    ]
  })
  console.log('seed เสร็จ')
}

main().finally(() => prisma.$disconnect())
