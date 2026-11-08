'use client'
import { api, baht, type PR, type PRItem } from '@/lib/client/api'
import { useUsers } from '@/lib/client/useUsers'
import { calcTotals } from '@/lib/pr/calculator'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import StatusBadge from '../../components/StatusBadge'
import UserSwitcher from '../../components/UserSwitcher'

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

  const canEditForm = isNew
    ? isRequester
    : !!pr && pr.status === 'DRAFT' && isOwner
  const canSubmit = !isNew && !!pr && pr.status === 'DRAFT' && isOwner
  const canDelete = canSubmit
  const canDecide = !isNew && !!pr && pr.status === 'PENDING' && isApprover

  const preview = calcTotals(
    toPayload(rows).map((r) => ({
      quantity: Number.isFinite(r.quantity) ? r.quantity : 0,
      unitPrice: Number.isFinite(r.unitPrice) ? r.unitPrice : 0
    }))
  )
  const totals = canEditForm ? preview : (pr ?? preview)

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

      await api<PR>(`/api/prs/${id}`, user.id, {
        method: 'PUT',
        body: { items: toPayload(rows) }
      })
      applyPR(
        await api<PR>(`/api/prs/${id}/submit`, user.id, { method: 'POST' })
      )
    })

  const approve = () =>
    run(async () => {
      if (!user) return
      applyPR(
        await api<PR>(`/api/prs/${id}/approve`, user.id, { method: 'POST' })
      )
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
    <>
      <UserSwitcher users={users} user={user} onChange={setUserId} />
      <main className="page">
        <p className="back">
          <Link href="/">← กลับหน้ารายการ</Link>
        </p>
        <div className="page-head">
          <div className="title">
            <h1>
              {isNew ? 'สร้างใบขอซื้อ' : `ใบขอซื้อ ${pr?.prNumber ?? ''}`}
            </h1>
            {!isNew && pr && <StatusBadge status={pr.status} />}
          </div>
        </div>

        {error && <p className="alert">{error}</p>}
        {isNew && user && !isRequester && (
          <p className="alert">เฉพาะ Requester เท่านั้นที่สร้าง PR ได้</p>
        )}

        {(isNew ? !!user : !!pr) && (
          <>
            <dl className="card meta">
              <div>
                <dt>ผู้ขอ</dt>
                <dd>{isNew ? user?.name : pr?.requesterName}</dd>
              </div>
              <div>
                <dt>แผนก</dt>
                <dd>{isNew ? user?.department : pr?.department}</dd>
              </div>
            </dl>

            {pr?.status === 'REJECTED' && (
              <p className="note">
                <b>เหตุผลที่ไม่อนุมัติ:</b> {pr.rejectReason}
              </p>
            )}

            <div className="card table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>ชื่อสินค้า</th>
                    <th className="num">จำนวน</th>
                    <th className="num">ราคา/หน่วย (บาท)</th>
                    <th className="num">รวม (บาท)</th>
                    {canEditForm && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const lineTotal =
                      Number(r.quantity) * Math.round(Number(r.unitPrice) * 100)
                    return (
                      <tr key={i}>
                        <td>
                          {canEditForm ? (
                            <input
                              aria-label="ชื่อสินค้า"
                              value={r.itemName}
                              onChange={(e) =>
                                setRow(i, { itemName: e.target.value })
                              }
                            />
                          ) : (
                            r.itemName
                          )}
                        </td>
                        <td className="num">
                          {canEditForm ? (
                            <input
                              aria-label="จำนวน"
                              type="number"
                              min={1}
                              step={1}
                              style={{
                                width: 80,
                                minWidth: 0,
                                textAlign: 'right'
                              }}
                              value={r.quantity}
                              onChange={(e) =>
                                setRow(i, { quantity: e.target.value })
                              }
                            />
                          ) : (
                            r.quantity
                          )}
                        </td>
                        <td className="num">
                          {canEditForm ? (
                            <input
                              aria-label="ราคาต่อหน่วย"
                              type="number"
                              min={0}
                              step="0.01"
                              style={{
                                width: 120,
                                minWidth: 0,
                                textAlign: 'right'
                              }}
                              value={r.unitPrice}
                              onChange={(e) =>
                                setRow(i, { unitPrice: e.target.value })
                              }
                            />
                          ) : (
                            baht(Math.round(Number(r.unitPrice) * 100))
                          )}
                        </td>
                        <td className="num">
                          {Number.isFinite(lineTotal) ? baht(lineTotal) : '-'}
                        </td>
                        {canEditForm && (
                          <td>
                            <button
                              type="button"
                              className="btn small"
                              disabled={busy || rows.length === 1}
                              onClick={() =>
                                setRows((rs) =>
                                  rs.filter((_, idx) => idx !== i)
                                )
                              }
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
            </div>
            {canEditForm && (
              <p className="add-row">
                <button
                  type="button"
                  className="btn small"
                  disabled={busy}
                  onClick={() => setRows((rs) => [...rs, emptyRow()])}
                >
                  + เพิ่มรายการ
                </button>
              </p>
            )}

            <div className="totals">
              <div>
                <span>ยอดก่อน VAT</span>
                <span>{baht(totals.subtotal)}</span>
              </div>
              <div>
                <span>VAT 7%</span>
                <span>{baht(totals.vat)}</span>
              </div>
              <div className="grand">
                <span>ยอดสุทธิ</span>
                <span>{baht(totals.total)} บาท</span>
              </div>
            </div>

            {(canEditForm || canSubmit || canDelete) && (
              <div className="actions">
                {canEditForm && (
                  <button
                    type="button"
                    className="btn primary"
                    disabled={busy}
                    onClick={save}
                  >
                    {isNew ? 'สร้าง PR (Draft)' : 'บันทึก'}
                  </button>
                )}
                {canSubmit && (
                  <button
                    type="button"
                    className="btn"
                    disabled={busy}
                    onClick={submit}
                  >
                    ส่งอนุมัติ
                  </button>
                )}
                {canDelete && (
                  <button
                    type="button"
                    className="btn danger"
                    disabled={busy}
                    onClick={remove}
                  >
                    ลบ
                  </button>
                )}
              </div>
            )}

            {canDecide && (
              <div className="card decide">
                <h2>พิจารณาอนุมัติ</h2>
                <div className="row">
                  <button
                    type="button"
                    className="btn primary"
                    disabled={busy}
                    onClick={approve}
                  >
                    อนุมัติ
                  </button>
                </div>
                <div className="row">
                  <input
                    placeholder="เหตุผลที่ไม่อนุมัติ"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn danger"
                    disabled={busy}
                    onClick={reject}
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </>
  )
}
