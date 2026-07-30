import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import OrderStatusBadge from '../../components/order/OrderStatusBadge'
import OrderStatusStepper from '../../components/order/OrderStatusStepper'
import { getOrder } from '../../services/order/orderService'
import { formatCurrency } from '../../utils/currency'
import { formatDateTime } from '../../utils/date'
import { formatPaymentMethod } from '../../utils/orderStatus'
import { getApiErrorMessage } from '../../utils/apiError'
import type { OrderResponse } from '../../types/order/order'
import styles from './OrderDetailPage.module.css'

const PRODUCT_ICON = (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="5" width="18" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M1.5 19.5h21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

// Chi tiết đơn hàng (Gói 4.1) — chỉ đọc; Hủy đơn/Yêu cầu trả hàng/Viết đánh
// giá là Gói 4.2/4.3/4.4, chưa có nút ở đây.
function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()

  const [order, setOrder] = useState<OrderResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setIsLoading(true)
    setError(null)
    getOrder(Number(id))
      .then(setOrder)
      .catch((err: unknown) => setError(getApiErrorMessage(err, 'Không tìm thấy đơn hàng')))
      .finally(() => setIsLoading(false))
  }, [id])

  if (isLoading) {
    return <p>Đang tải...</p>
  }

  if (error || !order) {
    return <p className={styles.error}>{error ?? 'Không tìm thấy đơn hàng'}</p>
  }

  const rawTotal = order.totalAmount + order.discountAmount

  return (
    <section className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="breadcrumb">
        <Link to="/">Trang chủ</Link>
        <span>/</span>
        <Link to="/account/orders">Đơn hàng của tôi</Link>
        <span>/</span>
        <span className={styles.breadcrumbCurrent}>#{order.id}</span>
      </nav>

      <div className={styles.headerCard}>
        <div className={styles.headerTop}>
          <div>
            <h1>
              Đơn hàng #{order.id} <OrderStatusBadge status={order.status} />
            </h1>
            <p className={styles.createdAt}>Đặt lúc {formatDateTime(order.createdAt)}</p>
          </div>
          <div className={styles.headerTotal}>
            <span>Tổng tiền</span>
            <span className={styles.totalAmount}>{formatCurrency(order.totalAmount)}</span>
          </div>
        </div>
        <OrderStatusStepper status={order.status} />
      </div>

      <div className={styles.layout}>
        <div className={styles.main}>
          <section className={styles.section}>
            <h2>Sản phẩm đã đặt</h2>
            <ul className={styles.itemList}>
              {order.items.map((item) => (
                <li key={item.id} className={styles.item}>
                  <span className={styles.productIcon}>{PRODUCT_ICON}</span>
                  <div className={styles.itemInfo}>
                    <p className={styles.productName}>{item.productName}</p>
                    <p className={styles.variantMeta}>
                      {item.variantName} · SKU: {item.sku}
                    </p>
                  </div>
                  <span className={styles.itemQty}>× {item.quantity}</span>
                  <span className={styles.itemTotal}>{formatCurrency(item.lineTotal)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.section}>
            <h2>Thông tin giao hàng</h2>
            <p className={styles.recipient}>
              <strong>{order.recipientName}</strong> — {order.phone}
            </p>
            <p className={styles.addressText}>
              {order.streetAddress}, {order.ward}, {order.district}, {order.province}
            </p>
            {order.note && (
              <>
                <h2 className={styles.noteHeading}>Ghi chú</h2>
                <p className={styles.noteText}>{order.note}</p>
              </>
            )}
          </section>
        </div>

        <aside className={styles.summary}>
          <h2>Tóm tắt đơn hàng</h2>
          <div className={styles.summaryRow}>
            <span>Phương thức thanh toán</span>
            <span>{formatPaymentMethod(order.paymentMethod)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Tạm tính</span>
            <span>{formatCurrency(rawTotal)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className={styles.summaryRow}>
              <span>Giảm giá {order.voucherCode ? `(${order.voucherCode})` : ''}</span>
              <span>-{formatCurrency(order.discountAmount)}</span>
            </div>
          )}
          <div className={styles.summaryTotalRow}>
            <span>Tổng cộng</span>
            <span className={styles.summaryTotal}>{formatCurrency(order.totalAmount)}</span>
          </div>
        </aside>
      </div>
    </section>
  )
}

export default OrderDetailPage
