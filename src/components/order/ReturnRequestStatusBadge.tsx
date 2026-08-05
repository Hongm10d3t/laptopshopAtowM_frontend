import type { ReturnRequestStatus } from '../../types/order/returnRequest'
import styles from './ReturnRequestStatusBadge.module.css'

const STATUS_LABELS: Record<ReturnRequestStatus, string> = {
  REQUESTED: 'Chờ xử lý',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Đã từ chối',
}

const STATUS_CLASSES: Record<ReturnRequestStatus, string> = {
  REQUESTED: styles.requested,
  APPROVED: styles.approved,
  REJECTED: styles.rejected,
}

interface ReturnRequestStatusBadgeProps {
  status: ReturnRequestStatus
}

function ReturnRequestStatusBadge({ status }: ReturnRequestStatusBadgeProps) {
  return (
    <span className={`${styles.badge} ${STATUS_CLASSES[status]}`}>
      <span className={styles.dot} aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  )
}

export default ReturnRequestStatusBadge
