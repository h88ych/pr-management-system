'use client'
import { useEffect, useState } from 'react'
import type { User } from './api'

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [userId, setUserIdState] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/users')
      .then((r) => r.json())
      .then((list: User[]) => {
        setUsers(list)
        const saved = Number(localStorage.getItem('userId'))
        setUserIdState(
          (list.find((u) => u.id === saved) ?? list[0])?.id ?? null
        )
      })
  }, [])

  const setUserId = (id: number) => {
    localStorage.setItem('userId', String(id))
    setUserIdState(id)
  }

  const user = users.find((u) => u.id === userId) ?? null
  return { users, user, setUserId }
  
}
