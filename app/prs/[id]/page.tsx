'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import UserSwitcher from '../../components/UserSwitcher'
import { useUsers } from '@/lib/client/useUsers'
import {
  api,
  baht,
  STATUS_TEXT,
  type PR,
  type PRItem
} from '@/lib/client/api'
import { calcTotals } from '@/lib/pr/calculator'

// ค่าในฟอร์มเก็บเป็น string (ราคาเป็นบาท) แล้วแปลงเป็นสตางค์ตอนส่งให้ server
type Row = { itemName: string; quantity: string; unitPrice: string }

const emptyRow = (): Row => ({ itemName: '', quantity: '1', unitPrice: '' })

const toRows = (items: PRItem[] = []): Row[] =>
  items.length
    ? items.map((i) => ({
        itemName: i.itemName,
        quantity: String(i.quantity),
        unitPrice: String(i.unitPrice / 100)
      }))
    : [emptyRow()]

const toPayload = (rows: Row[]) =>
  rows.map((r) => ({
    itemName: r.itemName,
    quantity: Number(r.quantity),
    unitPrice: Math.round(Number(r.unitPrice) * 100)
  }))

export default function PRDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const isNew = id === 'new'
  const { users, user, setUserId } = useUsers()

  const [pr, setPr] = useState<PR | null>(null)
  const [rows, setRows] = useState<Row[]>([emptyRow()])
  const [rejectReason, setRejectReason] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!user) return
    setError('')
    if (isNew) {
      setPr(null)
      setRows([emptyRow()])
      return
    }
    api<PR>(`/api/prs/${id}`, user.id)
      .then((data) => {
        setPr(data)
        setRows(toRows(data.items))
      })
      .catch((e) => setError(e.message))
  }, [id, user?.id])

  const isRequester = user?.role === 'REQUESTER'
  const isApprover = user?.role === 'APPROVER'
  const isOwner = !!pr && isRequester && user?.name === pr.requesterName

  // ปุ่ม/ฟอร์มที่แสดงตาม role + สถานะ (server ตรวจซ้ำทุกครั้ง)
  const canEditForm = isNew ? isRequester : !!pr && pr.status === 'DRAFT' && isOwner
  const canSubmit = !isNew && !!pr && pr.status === 'DRAFT' && isOwner
  const canDelete = canSubmit
  const canDecide = !isNew && !!pr && pr.status === 'PENDING' && isApprover

  // ยอดที่แสดงตอนแก้ไขเป็นแค่ preview ใช้ฟังก์ชันเดียวกับ server; ยอดจริง server เป็นคนคำนวณ
  const preview = calcTotals(
    toPayload(rows).map((r) => ({
      quantity: Number.isFinite(r.quantity) ? r.quantity : 0,
      unitPrice: Number.isFinite(r.unitPrice) ? r.unitPrice : 0
    }))
  )
  const totals = canEditForm ? preview : pr ?? preview

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError('')
    try {
      await fn()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
    } finally {
      setBusy(false)
    }
  }

  const applyPR = (data: PR) => {
    setPr(data)
    setRows(toRows(data.items))
  }

  const save = () =>
    run(async () => {
      if (!user) return
      if (isNew) {
        const created = await api<PR>('/api/prs', user.id, {
          method: 'POST',
          body: { items: toPayload(rows) }
        })
        router.replace(`/prs/${created.id}`)
      } else {
        applyPR(
          await api<PR>(`/api/prs/${id}`, user.id, {
            method: 'PUT',
            body: { items: toPayload(rows) }
          })
        )
      }
    })

  const remove = () =>
    run(async () => {
      if (!user || !confirm('ลบ PR ฉบับนี้?')) return
      await api(`/api/prs/${id}`, user.id, { method: 'DELETE' })
      router.push('/')
    })

  const submit = () =>
    run(async () => {
      if (!user) return
      // บันทึกรายการล่าสุดก่อนส่ง เพื่อไม่ให้ส่งข้อมูลที่ค้างอยู่ในฟอร์ม
      await api<PR>(`/api/prs/${id}`, user.id, {
        method: 'PUT',
        body: { items: toPayload(rows) }
      })
      applyPR(await api<PR>(`/api/prs/${id}/submit`, user.id, { method: 'POST' }))
    })

  const approve = () =>
    run(async () => {
      if (!user) return
      applyPR(await api<PR>(`/api/prs/${id}/approve`, user.id, { method: 'POST' }))
    })

  const reject = () =>
    run(async () => {
      if (!user) return
      if (!rejectReason.trim()) throw new Error('ต้องระบุเหตุผลในการ reject')
      applyPR(
        await api<PR>(`/api/prs/${id}/reject`, user.id, {
          method: 'POST',
          body: { reason: rejectReason }
        })
      )
      setRejectReason('')
    })

  const setRow = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))

  return (
    <main>
      <UserSwitcher users={users} user={user} onChange={setUserId} />
      <p><Link href="/">← กลับหน้ารายการ</Link></p>
      <h1>{isNew ? 'สร้างใบขอซื้อ' : `ใบขอซื้อ ${pr?.prNumber ?? ''}`}</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {isNew && user && !isRequester && (
        <p style={{ color: 'red' }}>เฉพาะ Requester เท่านั้นที่สร้าง PR ได้</p>
      )}

      {(isNew ? !!user : !!pr) && (
        <>
          <p>ผู้ขอ: {isNew ? user?.name : pr?.requesterName}</p>
          <p>แผนก: {isNew ? user?.department : pr?.department}</p>
          {!isNew && pr && <p>สถานะ: {STATUS_TEXT[pr.status]}</p>}
          {pr?.status === 'REJECTED' && (
            <p>เหตุผลที่ไม่อนุมัติ: {pr.rejectReason}</p>
          )}

          <table border={1} cellPadding={6}>
            <thead>
              <tr>
                <th>ชื่อสินค้า</th>
                <th>จำนวน</th>
                <th>ราคา/หน่วย (บาท)</th>
                <th>รวม (บาท)</th>
                {canEditForm && <th></th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const lineTotal = Number(r.quantity) * Math.round(Number(r.unitPrice) * 100)
                return (
                  <tr key={i}>
                    <td>
                      {canEditForm ? (
                        <input
                          value={r.itemName}
                          onChange={(e) => setRow(i, { itemName: e.target.value })}
                        />
                      ) : (
                        r.itemName
                      )}
                    </td>
                    <td align="right">
                      {canEditForm ? (
                        <input
                          type="number"
                          min={1}
                          step={1}
                          style={{ width: 70 }}
                          value={r.quantity}
                          onChange={(e) => setRow(i, { quantity: e.target.value })}
                        />
                      ) : (
                        r.quantity
                      )}
                    </td>
                    <td align="right">
                      {canEditForm ? (
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          style={{ width: 110 }}
                          value={r.unitPrice}
                          onChange={(e) => setRow(i, { unitPrice: e.target.value })}
                        />
                      ) : (
                        baht(Math.round(Number(r.unitPrice) * 100))
                      )}
                    </td>
                    <td align="right">
                      {Number.isFinite(lineTotal) ? baht(lineTotal) : '-'}
                    </td>
                    {canEditForm && (
                      <td>
                        <button
                          type="button"
                          disabled={busy || rows.length === 1}
                          onClick={() => setRows((rs) => rs.filter((_, idx) => idx !== i))}
                        >
                          ลบแถว
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
          {canEditForm && (
            <p>
              <button
                type="button"
                disabled={busy}
                onClick={() => setRows((rs) => [...rs, emptyRow()])}
              >
                + เพิ่มรายการ
              </button>
            </p>
          )}

          <p>ยอดก่อน VAT: {baht(totals.subtotal)}</p>
          <p>VAT 7%: {baht(totals.vat)}</p>
          <p><b>ยอดสุทธิ: {baht(totals.total)} บาท</b></p>

          <p>
            {canEditForm && (
              <button type="button" disabled={busy} onClick={save}>
                {isNew ? 'สร้าง PR (Draft)' : 'บันทึก'}
              </button>
            )}{' '}
            {canSubmit && (
              <button type="button" disabled={busy} onClick={submit}>
                ส่งอนุมัติ
              </button>
            )}{' '}
            {canDelete && (
              <button type="button" disabled={busy} onClick={remove}>
                ลบ
              </button>
            )}
          </p>

          {canDecide && (
            <p>
              <button type="button" disabled={busy} onClick={approve}>
                อนุมัติ
              </button>
              <br />
              <br />
              <input
                placeholder="เหตุผลที่ไม่อนุมัติ"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />{' '}
              <button type="button" disabled={busy} onClick={reject}>
                Reject
              </button>
            </p>
          )}
        </>
      )}
    </main>
  )
}
