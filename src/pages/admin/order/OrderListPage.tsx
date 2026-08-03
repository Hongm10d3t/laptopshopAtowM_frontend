import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import OrderStatusBadge from '../../../components/order/OrderStatusBadge'
import { listAdminOrders } from '../../../services/order/adminOrderService'
import type { PageResponse } from '../../../types/common/pageResponse'
import type {
  OrderStatus,
  OrderSummaryResponse,
  PaymentStatus,
} from '../../../types/order/order'
import { getApiErrorMessage } from '../../../utils/apiError'
import { formatCurrency } from '../../../utils/currency'
import { formatDateTime } from '../../../utils/date'
import { formatPaymentStatus } from '../../../utils/orderStatus'
import styles from './OrderListPage.module.css'

const PAGE_SIZE = 20

const ORDER_STATUS_OPTIONS: Array<{ value: OrderStatus; label: string }> = [
  { value: 'PENDING', label: 'Chờ xác nhận' },
  { value: 'CONFIRMED', label: 'Đã xác nhận' },
  { value: 'PREPARING', label: 'Đang chuẩn bị hàng' },
  { value: 'SHIPPING', label: 'Đang giao hàng' },
  { value: 'DELIVERED', label: 'Đã giao hàng' },
  { value: 'RETURN_REQUESTED', label: 'Yêu cầu trả hàng' },
  { value: 'RETURNED', label: 'Đã trả hàng' },
  { value: 'CANCELLED', label: 'Đã hủy' },
]

const PAYMENT_STATUS_CLASS: Record<PaymentStatus, string> = {
  PENDING: styles.paymentPending,
  PAID: styles.paymentPaid,
  FAILED: styles.paymentFailed,
  CANCELLED: styles.paymentCancelled,
}

function isOrderStatus(value: string | null): value is OrderStatus {
  return ORDER_STATUS_OPTIONS.some((option) => option.value === value)
}

function parsePage(value: string | null): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
}

function OrderListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const statusParam = searchParams.get('status')
  const selectedStatus = isOrderStatus(statusParam) ? statusParam : undefined
  const page = parsePage(searchParams.get('page'))

  const [orders, setOrders] = useState<OrderSummaryResponse[]>([])
  const [pageInfo, setPageInfo] = useState<Omit<PageResponse<OrderSummaryResponse>, 'content'> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isCancelled = false

    setIsLoading(true)
    setError(null)

    listAdminOrders({
      status: selectedStatus,
      page: page - 1,
      size: PAGE_SIZE,
    })
      .then((result) => {
        if (isCancelled) return
        setOrders(result.content)
        setPageInfo(result)
      })
      .catch((err: unknown) => {
        if (!isCancelled) {
          setError(getApiErrorMessage(err, 'Không thể tải danh sách đơn hàng'))
        }
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false)
      })

    return () => {
      isCancelled = true
    }
  }, [page, selectedStatus])

  function updateQuery(next: { status?: OrderStatus; page?: number }) {
    const params = new URLSearchParams(searchParams)

    if (next.status) params.set('status', next.status)
    else params.delete('status')

    const nextPage = next.page ?? 1
    if (nextPage > 1) params.set('page', String(nextPage))
    else params.delete('page')

    setSearchParams(params)
  }

  function handleStatusChange(value: string) {
    updateQuery({
      status: isOrderStatus(value) ? value : undefined,
      page: 1,
    })
  }

  return (
    <section>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Vận hành</p>
          <h1>
            Đơn hàng
            {pageInfo && (
              <span className={styles.countBadge}>
                {pageInfo.totalElements} đơn
              </span>
            )}
          </h1>
          <p className={styles.description}>
            Theo dõi trạng thái xử lý và thanh toán của toàn bộ đơn hàng.
          </p>
        </div>
      </div>

      <div className={styles.toolbar}>
        <label className={styles.filterField}>
          <span>Trạng thái đơn</span>
          <select
            value={selectedStatus ?? ''}
            onChange={(event) => handleStatusChange(event.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            {ORDER_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {selectedStatus && (
          <button
            type="button"
            className={styles.clearFilterButton}
            onClick={() => updateQuery({ page: 1 })}
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {error && (
        <div className={styles.error} role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => updateQuery({ status: selectedStatus, page })}>
            Thử lại
          </button>
        </div>
      )}

      <div className={styles.tableWrapper} aria-busy={isLoading}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Ngày đặt</th>
              <th>Thanh toán</th>
              <th className={styles.alignRight}>Tổng tiền</th>
              <th>Trạng thái</th>
              <th className={styles.actionHeader}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }, (_, index) => (
                <tr key={index} className={styles.skeletonRow}>
                  <td><span /></td>
                  <td><span /></td>
                  <td><span /></td>
                  <td><span /></td>
                  <td><span /></td>
                  <td><span /></td>
                </tr>
              ))
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className={styles.emptyState}>
                    <strong>Không có đơn hàng phù hợp</strong>
                    <span>Hãy thử chọn trạng thái khác.</span>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <Link to={`/admin/orders/${order.id}`} className={styles.orderLink}>
                      #{order.id}
                    </Link>
                  </td>
                  <td className={styles.mutedCell}>{formatDateTime(order.createdAt)}</td>
                  <td>
                    <div className={styles.paymentCell}>
                      <span className={styles.paymentMethod}>
                        {order.paymentMethod === 'COD' ? 'COD' : 'Online'}
                      </span>
                      {order.paymentStatus ? (
                        <span className={PAYMENT_STATUS_CLASS[order.paymentStatus]}>
                          {formatPaymentStatus(order.paymentStatus)}
                        </span>
                      ) : (
                        <span className={styles.paymentCod}>Thu khi giao hàng</span>
                      )}
                    </div>
                  </td>
                  <td className={`${styles.totalCell} ${styles.alignRight}`}>
                    {formatCurrency(order.totalAmount)}
                  </td>
                  <td>
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className={styles.actionCell}>
                    <Link to={`/admin/orders/${order.id}`} className={styles.detailLink}>
                      Xem chi tiết →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && pageInfo && pageInfo.totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => updateQuery({ status: selectedStatus, page: page - 1 })}
          >
            ← Trước
          </button>
          <span>
            Trang <strong>{page}</strong> / {pageInfo.totalPages}
          </span>
          <button
            type="button"
            disabled={pageInfo.last}
            onClick={() => updateQuery({ status: selectedStatus, page: page + 1 })}
          >
            Sau →
          </button>
        </div>
      )}
    </section>
  )
}

export default OrderListPage
