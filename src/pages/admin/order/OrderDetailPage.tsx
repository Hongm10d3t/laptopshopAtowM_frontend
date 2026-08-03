import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import OrderStatusBadge from '../../../components/order/OrderStatusBadge'
import { getAdminOrder } from '../../../services/order/adminOrderService'
import type { OrderResponse, PaymentStatus } from '../../../types/order/order'
import { getApiErrorMessage } from '../../../utils/apiError'
import { formatCurrency } from '../../../utils/currency'
import { formatDateTime } from '../../../utils/date'
import {
  formatPaymentMethod,
  formatPaymentStatus,
} from '../../../utils/orderStatus'
import styles from './OrderDetailPage.module.css'

const PAYMENT_STATUS_CLASS: Record<PaymentStatus, string> = {
  PENDING: styles.paymentPending,
  PAID: styles.paymentPaid,
  FAILED: styles.paymentFailed,
  CANCELLED: styles.paymentCancelled,
}

function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const orderId = Number(id)
  const isValidOrderId = Number.isInteger(orderId) && orderId > 0

  const [order, setOrder] = useState<OrderResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isValidOrderId) {
      setError('Mã đơn hàng không hợp lệ')
      setIsLoading(false)
      return
    }

    let isCancelled = false
    setIsLoading(true)
    setError(null)

    getAdminOrder(orderId)
      .then((result) => {
        if (!isCancelled) setOrder(result)
      })
      .catch((err: unknown) => {
        if (!isCancelled) {
          setError(getApiErrorMessage(err, 'Không thể tải chi tiết đơn hàng'))
        }
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false)
      })

    return () => {
      isCancelled = true
    }
  }, [isValidOrderId, orderId])

  if (isLoading) {
    return (
      <section>
        <div className={styles.loadingHeader} />
        <div className={styles.loadingGrid}>
          <div />
          <div />
        </div>
      </section>
    )
  }

  if (!order) {
    return (
      <section>
        <Link to="/admin/orders" className={styles.backLink}>
          ← Quay lại danh sách đơn
        </Link>
        <div className={styles.errorState} role="alert">
          <strong>Không thể hiển thị đơn hàng</strong>
          <span>{error ?? 'Không tìm thấy đơn hàng'}</span>
        </div>
      </section>
    )
  }

  const itemSubtotal = order.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  )

  return (
    <section>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link to="/admin/orders">Đơn hàng</Link>
        <span>/</span>
        <span>#{order.id}</span>
      </nav>

      <div className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <h1>Đơn hàng #{order.id}</h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p>Đặt lúc {formatDateTime(order.createdAt)}</p>
        </div>
      </div>

      {error && <p className={styles.inlineError}>{error}</p>}

      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          <article className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Sản phẩm</h2>
              <span>{order.items.length} dòng hàng</span>
            </div>

            <div className={styles.itemTableWrapper}>
              <table className={styles.itemTable}>
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Đơn giá</th>
                    <th>Số lượng</th>
                    <th>Giảm giá</th>
                    <th>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className={styles.productCell}>
                          <strong>{item.productName}</strong>
                          <span>{item.variantName || item.sku}</span>
                          <small>SKU: {item.sku}</small>
                        </div>
                      </td>
                      <td>{formatCurrency(item.unitPrice)}</td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(item.discountAmount)}</td>
                      <td className={styles.lineTotal}>{formatCurrency(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className={styles.card}>
            <h2>Thông tin giao hàng</h2>
            <div className={styles.infoGrid}>
              <div>
                <span>Người nhận</span>
                <strong>{order.recipientName}</strong>
              </div>
              <div>
                <span>Số điện thoại</span>
                <strong>{order.phone}</strong>
              </div>
              <div className={styles.fullWidth}>
                <span>Địa chỉ</span>
                <strong>
                  {order.streetAddress}, {order.ward}, {order.district}, {order.province}
                </strong>
              </div>
              <div className={styles.fullWidth}>
                <span>Ghi chú của khách</span>
                <strong>{order.note || 'Không có ghi chú'}</strong>
              </div>
            </div>
          </article>
        </div>

        <aside className={styles.sideColumn}>
          <article className={styles.card}>
            <h2>Thanh toán</h2>
            <dl className={styles.summaryList}>
              <div>
                <dt>Phương thức</dt>
                <dd>{formatPaymentMethod(order.paymentMethod)}</dd>
              </div>
              <div>
                <dt>Trạng thái</dt>
                <dd>
                  {order.paymentStatus ? (
                    <span className={PAYMENT_STATUS_CLASS[order.paymentStatus]}>
                      {formatPaymentStatus(order.paymentStatus)}
                    </span>
                  ) : (
                    <span className={styles.paymentCod}>Thu khi giao hàng</span>
                  )}
                </dd>
              </div>
            </dl>
          </article>

          <article className={styles.card}>
            <h2>Tổng kết đơn hàng</h2>
            <dl className={styles.summaryList}>
              <div>
                <dt>Tạm tính</dt>
                <dd>{formatCurrency(itemSubtotal)}</dd>
              </div>
              <div>
                <dt>Giảm giá</dt>
                <dd>-{formatCurrency(order.discountAmount)}</dd>
              </div>
              {order.voucherCode && (
                <div>
                  <dt>Mã giảm giá</dt>
                  <dd>{order.voucherCode}</dd>
                </div>
              )}
              <div className={styles.grandTotal}>
                <dt>Khách cần trả</dt>
                <dd>{formatCurrency(order.totalAmount)}</dd>
              </div>
            </dl>
          </article>

          <Link to="/admin/orders" className={styles.backButton}>
            ← Quay lại danh sách
          </Link>
        </aside>
      </div>
    </section>
  )
}

export default OrderDetailPage
