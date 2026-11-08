export type User = {
  id: number
  name: string
  role: string
  department: string
}
export type PRItem = {
  id?: number
  itemName: string
  quantity: number
  unitPrice: number
}
export type PR = {
  id: number
  prNumber: string
  requesterName: string
  department: string
  status: string
  rejectReason: string | null
  subtotal: number
  vat: number
  total: number
  items?: PRItem[]
}

export const STATUS_TEXT: Record<string, string> = {
  DRAFT: 'ฉบับร่าง',
  PENDING: 'รออนุมัติ',
  APPROVED: 'อนุมัติแล้ว',
  REJECTED: 'ไม่อนุมัติ'
}

export const baht = (satang: number) =>
  (satang / 100).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })

export async function api<T>(
  path: string,
  userId: number,
  opts: { method?: string; body?: unknown } = {}
): Promise<T> {
  const res = await fetch(path, {
    method: opts.method ?? 'GET',
    headers: {
      'x-user-id': String(userId),
      'Content-Type': 'application/json'
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error ?? 'เกิดข้อผิดพลาด')
  return data as T
}
