import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import OrderStatusBadge from '../../../components/order/OrderStatusBadge'
import PaymentStatusBadge from '../../../components/payment/PaymentStatusBadge'
import { getAdminOrder } from '../../../services/order/adminOrderService'
import { getAdminPayment } from '../../../services/payment/adminPaymentService'
import type { OrderResponse } from '../../../types/order/order'
import type { PaymentResponse } from '../../../types/payment/payment'
import { getApiErrorMessage } from '../../../utils/apiError'
import { formatCurrency } from '../../../utils/currency'
import { formatDateTime } from '../../../utils/date'
import { formatPaymentMethod } from '../../../utils/orderStatus'
import styles from './PaymentDetailPage.module.css'

function getStatusDescription(payment: PaymentResponse): string {
  switch (payment.status) {
    case 'PENDING':
      return 'Phiên thanh toán đang chờ VNPay xác nhận. Không dùng trang return của trình duyệt làm nguồn kết luận.'
    case 'PAID':
      return 'Backend đã xác thực IPN và ghi nhận giao dịch thanh toán thành công.'
    case 'FAILED':
      return 'VNPay đã trả kết quả thất bại cho phiên thanh toán gần nhất. Khách có thể thử thanh toán lại nếu đơn còn hợp lệ.'
    case 'CANCELLED':
      return 'Payment đã bị hủy do đơn bị hủy hoặc phiên thanh toán hết hạn theo xử lý của Backend.'
  }
}

function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const paymentId = Number(id)
  const isValidPaymentId = Number.isInteger(paymentId) && paymentId > 0

  const [payment, setPayment] = useState<PaymentResponse | null>(null)
  const [order, setOrder] = useState<OrderResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orderError, setOrderError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!isValidPaymentId) {
      setError('Mã giao dịch thanh toán không hợp lệ')
      setIsLoading(false)
      return
    }

    let isCancelled = false
    setIsLoading(true)
    setError(null)
    setOrderError(null)
    setPayment(null)
    setOrder(null)

    getAdminPayment(paymentId)
      .then(async (paymentResult) => {
        if (isCancelled) return
        setPayment(paymentResult)

        try {
          const orderResult = await getAdminOrder(paymentResult.orderId)
          if (!isCancelled) setOrder(orderResult)
        } catch (err: unknown) {
          if (!isCancelled) {
            setOrderError(
              getApiErrorMessage(
                err,
                'Không thể tải đơn hàng liên quan đến giao dịch',
              ),
            )
          }
        }
      })
      .catch((err: unknown) => {
        if (!isCancelled) {
          setError(
            getApiErrorMessage(err, 'Không thể tải chi tiết thanh toán'),
          )
        }
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false)
      })

    return () => {
      isCancelled = true
    }
  }, [isValidPaymentId, paymentId, reloadKey])

  if (isLoading) {
    return (
      <section aria-busy="true">
        <div className={styles.skeletonHeader} />
        <div className={styles.skeletonLayout}>
          <div className={styles.skeletonCard} />
          <div className={styles.skeletonCard} />
        </div>
      </section>
    )
  }

  if (error || !payment) {
    return (
      <section>
        <div className={styles.breadcrumb}>
          <Link to="/admin/payments">Thanh toán</Link>
          <span>/</span>
          <span>Chi tiết</span>
        </div>
        <div className={styles.errorState} role="alert">
          <strong>Không thể hiển thị giao dịch</strong>
          <span>{error ?? 'Không tìm thấy dữ liệu thanh toán'}</span>
          {isValidPaymentId && (
            <button type="button" onClick={() => setReloadKey((value) => value + 1)}>
              Thử lại
            </button>
          )}
          <Link to="/admin/payments">← Quay lại danh sách</Link>
        </div>
      </section>
    )
  }

  const amountMatchesOrder = order
    ? Number(order.totalAmount) === Number(payment.amount)
    : null

  return (
    <section>
      <div className={styles.breadcrumb}>
        <Link to="/admin/payments">Thanh toán</Link>
        <span>/</span>
        <span>Giao dịch #{payment.id}</span>
      </div>

      <div className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <h1>Giao dịch #{payment.id}</h1>
            <PaymentStatusBadge status={payment.status} />
          </div>
          <p>Khởi tạo lúc {formatDateTime(payment.createdAt)}</p>
        </div>
        <Link
          to={`/admin/orders/${payment.orderId}`}
          className={styles.openOrderButton}
        >
          Mở đơn hàng #{payment.orderId} →
        </Link>
      </div>

      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          <article className={`${styles.card} ${styles.statusCard}`}>
            <p className={styles.cardEyebrow}>Trạng thái xác nhận</p>
            <div className={styles.statusHeading}>
              <PaymentStatusBadge status={payment.status} />
              <strong>{formatCurrency(payment.amount)}</strong>
            </div>
            <p className={styles.statusDescription}>
              {getStatusDescription(payment)}
            </p>
          </article>

          <article className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Thông tin giao dịch</h2>
              <span>Chỉ đọc</span>
            </div>
            <dl className={styles.detailGrid}>
              <div>
                <dt>Mã payment</dt>
                <dd>#{payment.id}</dd>
              </div>
              <div>
                <dt>Mã đơn hàng</dt>
                <dd>
                  <Link to={`/admin/orders/${payment.orderId}`}>
                    #{payment.orderId}
                  </Link>
                </dd>
              </div>
              <div>
                <dt>Số tiền</dt>
                <dd>{formatCurrency(payment.amount)}</dd>
              </div>
              <div>
                <dt>Mã giao dịch VNPay</dt>
                <dd className={styles.monospace}>
                  {payment.gatewayTransactionNo ?? 'Chưa có'}
                </dd>
              </div>
            </dl>
          </article>

          <article className={styles.card}>
            <h2>Dòng thời gian thanh toán</h2>
            <ol className={styles.timeline}>
              <li className={styles.timelineComplete}>
                <span className={styles.timelineMarker} />
                <div>
                  <strong>Khởi tạo payment</strong>
                  <small>{formatDateTime(payment.createdAt)}</small>
                </div>
              </li>
              <li
                className={
                  payment.status === 'PAID'
                    ? styles.timelineComplete
                    : styles.timelineNeutral
                }
              >
                <span className={styles.timelineMarker} />
                <div>
                  <strong>Hạn phiên thanh toán</strong>
                  <small>{formatDateTime(payment.expiresAt)}</small>
                </div>
              </li>
              {payment.paidAt && (
                <li className={styles.timelineSuccess}>
                  <span className={styles.timelineMarker} />
                  <div>
                    <strong>Backend xác nhận đã thanh toán</strong>
                    <small>{formatDateTime(payment.paidAt)}</small>
                  </div>
                </li>
              )}
            </ol>
          </article>

          <article className={`${styles.card} ${styles.sourceCard}`}>
            <h2>Nguồn dữ liệu thanh toán</h2>
            <p>
              Trạng thái trên màn hình được đọc từ bản ghi Payment của Backend.
              Frontend không có API và không cung cấp thao tác sửa trạng thái
              thủ công.
            </p>
          </article>
        </div>

        <aside className={styles.sideColumn}>
          <article className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Đơn hàng liên quan</h2>
              {order && <OrderStatusBadge status={order.status} />}
            </div>

            {orderError ? (
              <div className={styles.inlineError} role="alert">
                {orderError}
              </div>
            ) : order ? (
              <dl className={styles.summaryList}>
                <div>
                  <dt>Mã đơn</dt>
                  <dd>
                    <Link to={`/admin/orders/${order.id}`}>#{order.id}</Link>
                  </dd>
                </div>
                <div>
                  <dt>Phương thức</dt>
                  <dd>{formatPaymentMethod(order.paymentMethod)}</dd>
                </div>
                <div>
                  <dt>Tổng đơn</dt>
                  <dd>{formatCurrency(order.totalAmount)}</dd>
                </div>
                <div>
                  <dt>Số dòng hàng</dt>
                  <dd>{order.items.length}</dd>
                </div>
              </dl>
            ) : (
              <p className={styles.mutedText}>Đang chờ dữ liệu đơn hàng.</p>
            )}

            <Link
              to={`/admin/orders/${payment.orderId}`}
              className={styles.fullWidthLink}
            >
              Xem chi tiết đơn hàng →
            </Link>
          </article>

          <article className={styles.card}>
            <h2>Đối chiếu số tiền</h2>
            {amountMatchesOrder === null ? (
              <p className={styles.mutedText}>
                Chưa thể đối chiếu do không tải được đơn hàng.
              </p>
            ) : amountMatchesOrder ? (
              <div className={styles.matchState}>
                <strong>Khớp số tiền</strong>
                <span>
                  Payment và tổng đơn đều là {formatCurrency(payment.amount)}.
                </span>
              </div>
            ) : (
              <div className={styles.mismatchState} role="alert">
                <strong>Không khớp số tiền</strong>
                <span>
                  Payment: {formatCurrency(payment.amount)} · Đơn:{' '}
                  {order ? formatCurrency(order.totalAmount) : '—'}
                </span>
              </div>
            )}
          </article>

          <Link to="/admin/payments" className={styles.backLink}>
            ← Quay lại danh sách thanh toán
          </Link>
        </aside>
      </div>
    </section>
  )
}

export default PaymentDetailPage
