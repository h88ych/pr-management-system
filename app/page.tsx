'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useUsers } from '@/lib/client/useUsers'
import { api, baht, STATUS_TEXT, type PR } from '@/lib/client/api'
import UserSwitcher from './components/UserSwitcher'
import StatusBadge from './components/StatusBadge'

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
    <>
      <UserSwitcher users={users} user={user} onChange={setUserId} />
      <main className="page">
        <div className="page-head">
          <h1>รายการใบขอซื้อ</h1>
          {user?.role === 'REQUESTER' && (
            <Link href="/prs/new" className="btn primary">
              สร้าง PR
            </Link>
          )}
        </div>

        <div className="toolbar">
          <label htmlFor="status-filter">สถานะ</label>
          <select
            id="status-filter"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">ทั้งหมด</option>
            {Object.entries(STATUS_TEXT).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="alert">{error}</p>}

        <div className="card table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>เลขที่</th>
                <th>ผู้ขอ</th>
                <th className="num">ยอดรวม (บาท)</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="clickable">
                  <td>
                    <Link href={`/prs/${p.id}`}>{p.prNumber}</Link>
                  </td>
                  <td>{p.requesterName}</td>
                  <td className="num">{baht(p.total)}</td>
                  <td>
                    <StatusBadge status={p.status} />
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={4} className="empty">
                    ไม่มีรายการ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  )
}
