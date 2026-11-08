'use client'
import Link from 'next/link'
import type { User } from '@/lib/client/api'

type Props = { users: User[]; user: User | null; onChange: (id: number) => void }

const ROLE_TEXT: Record<string, string> = {
  REQUESTER: 'Requester',
  APPROVER: 'Approver'
}

export default function UserSwitcher({ users, user, onChange }: Props) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link href="/" className="brand">
          ระบบใบขอซื้อ (PR)
        </Link>
        <div className="userbar">
          <label htmlFor="user-select">ผู้ใช้งาน</label>
          <select
            id="user-select"
            value={user?.id ?? ''}
            onChange={(e) => onChange(Number(e.target.value))}
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({ROLE_TEXT[u.role] ?? u.role})
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  )
}
