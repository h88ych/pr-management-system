'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useUsers } from '@/lib/client/useUsers'
import { api, baht, STATUS_TEXT, type PR } from '@/lib/client/api'
import UserSwitcher from './components/UserSwitcher'

export default function PRListPage() {
  const { users, user, setUserId } = useUsers()
  const [status, setStatus] = useState('')
  const [list, setList] = useState<PR[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    setError('')
    const q = status ? `?status=${status}` : ''
    api<PR[]>(`/api/prs${q}`, user.id)
      .then(setList)
      .catch((e) => setError(e.message))
  }, [user?.id, status])

  return (
    <main>
      <UserSwitcher users={users} user={user} onChange={setUserId} />
      <h1>รายการใบขอซื้อ (PR)</h1>

      <p>
        สถานะ:{' '}
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">ทั้งหมด</option>
          {Object.entries(STATUS_TEXT).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>{' '}
        {user?.role === 'REQUESTER' && <Link href="/prs/new">[+ สร้าง PR]</Link>}
      </p>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <table border={1} cellPadding={6}>
        <thead>
          <tr>
            <th>เลขที่</th>
            <th>ผู้ขอ</th>
            <th>ยอดรวม (บาท)</th>
            <th>สถานะ</th>
          </tr>
        </thead>
        <tbody>
          {list.map((p) => (
            <tr key={p.id}>
              <td><Link href={`/prs/${p.id}`}>{p.prNumber}</Link></td>
              <td>{p.requesterName}</td>
              <td align="right">{baht(p.total)}</td>
              <td>{STATUS_TEXT[p.status]}</td>
            </tr>
          ))}
          {list.length === 0 && (
            <tr>
              <td colSpan={4}>ไม่มีรายการ</td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  )
}