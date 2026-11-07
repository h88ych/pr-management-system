import { NextResponse } from 'next/server'
import { AppError } from './pr/error'
import { prisma } from './prisma'

export async function getCurrentUser(req: Request) {
  const id = Number(req.headers.get('x-user-id'))
  const user =
    Number.isInteger(id) && id > 0
      ? await prisma.user.findUnique({ where: { id } })
      : null
  if (!user) throw new AppError(401, 'ไม่พบผู้ใช้ (header x-user-id)')
  return user
}

export function parseId(raw: string) {
  const id = Number(raw)
  if (!Number.isInteger(id) || id <= 0) throw new AppError(400, 'id ไม่ถูกต้อง')
  return id
}

export async function readJson(req: Request) {
  try {
    return await req.json()
  } catch {
    throw new AppError(400, 'JSON ไม่ถูกต้อง')
  }
}

export async function handle(fn: () => Promise<unknown>, status = 200) {
  try {
    return NextResponse.json(await fn(), { status })
  } catch (e) {
    if (e instanceof AppError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    console.error(e)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
