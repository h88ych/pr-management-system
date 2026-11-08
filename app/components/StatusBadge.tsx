import { STATUS_TEXT } from '@/lib/client/api'

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge badge-${status.toLowerCase()}`}>
      {STATUS_TEXT[status] ?? status}
    </span>
  )
}
