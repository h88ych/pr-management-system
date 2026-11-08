'use client'
import type { User } from '@/lib/client/api'

type Props = { users: User[]; user: User | null; onChange: (id: number) => void }

export default function UserSwitcher({ users, user, onChange }: Props) {
  return (
    <p>
      ผู้ใช้งาน:{' '}
      <select value={user?.id ?? ''} onChange={(e) => onChange(Number(e.target.value))}>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name} ({u.role})
          </option>
        ))}
      </select>
    </p>
  )
}