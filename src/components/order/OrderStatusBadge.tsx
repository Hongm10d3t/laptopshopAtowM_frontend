import type { OrderStatus } from '../../types/order/order'
import { formatOrderStatus } from '../../utils/orderStatus'
import styles from './OrderStatusBadge.module.css'

const STYLE_BY_STATUS: Record<OrderStatus, string> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  PREPARING: 'info',
  SHIPPING: 'info',
  DELIVERED: 'success',
  CANCELLED: 'danger',
  RETURN_REQUESTED: 'warning',
  RETURNED: 'muted',
}

interface OrderStatusBadgeProps {
  status: OrderStatus
}

// Badge màu theo trạng thái đơn — dùng chung cho OrderListPage và
// OrderDetailPage, cùng 1 nguồn màu để không lệch nhau giữa 2 trang.
function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return <span className={styles[STYLE_BY_STATUS[status]]}>{formatOrderStatus(status)}</span>
}

export default OrderStatusBadge
