'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import UserSwitcher from '../../components/UserSwitcher'
import { useUsers } from '@/lib/client/useUsers'
import { api, baht, STATUS_TEXT, type PR } from '@/lib/client/api'

export default function PRDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { users, user, setUserId } = useUsers()
  const [pr, setPr] = useState<PR | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    setError('')
    api<PR>(`/api/prs/${id}`, user.id)
      .then(setPr)
      .catch((e) => setError(e.message))
  }, [id, user?.id])

  return (
    <main>
      <UserSwitcher users={users} user={user} onChange={setUserId} />
      <p><Link href="/">← กลับหน้ารายการ</Link></p>
      <h1>ใบขอซื้อ {pr?.prNumber}</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {pr && (
        <>
          <p>ผู้ขอ: {pr.requesterName}</p>
          <p>แผนก: {pr.department}</p>
          <p>สถานะ: {STATUS_TEXT[pr.status]}</p>
          {pr.status === 'REJECTED' && <p>เหตุผลที่ไม่อนุมัติ: {pr.rejectReason}</p>}

          <table border={1} cellPadding={6}>
            <thead>
              <tr>
                <th>ชื่อสินค้า</th>
                <th>จำนวน</th>
                <th>ราคา/หน่วย (บาท)</th>
              </tr>
            </thead>
            <tbody>
              {pr.items?.map((i) => (
                <tr key={i.id}>
                  <td>{i.itemName}</td>
                  <td>{i.quantity}</td>
                  <td align="right">{baht(i.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p>ยอดก่อน VAT: {baht(pr.subtotal)}</p>
          <p>VAT 7%: {baht(pr.vat)}</p>
          <p><b>ยอดสุทธิ: {baht(pr.total)} บาท</b></p>
        </>
      )}
    </main>
  )
}