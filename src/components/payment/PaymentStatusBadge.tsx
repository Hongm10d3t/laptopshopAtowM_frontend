import type { PaymentStatus } from '../../types/order/order'
import { formatPaymentStatus } from '../../utils/orderStatus'
import styles from './PaymentStatusBadge.module.css'

interface PaymentStatusBadgeProps {
  status: PaymentStatus
}

function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[status.toLowerCase()]}`}>
      <span className={styles.dot} aria-hidden="true" />
      {formatPaymentStatus(status)}
    </span>
  )
}

export default PaymentStatusBadge
