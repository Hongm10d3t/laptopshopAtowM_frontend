import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import OrderStatusBadge from '../../components/order/OrderStatusBadge'
import { cancelOrder, listOrders } from '../../services/order/orderService'
import { getPaymentUrl } from '../../services/payment/paymentService'
import { formatCurrency } from '../../utils/currency'
import { formatDate } from '../../utils/date'
import { formatPaymentMethod, isOrderCancellableByCustomer, isOrderPayableOnline } from '../../utils/orderStatus'
import { getApiErrorMessage } from '../../utils/apiError'
import type { OrderSummaryResponse } from '../../types/order/order'
import type { PageResponse } from '../../types/common/pageResponse'
import styles from './OrderListPage.module.css'

const PAGE_SIZE = 10

// Danh sách đơn hàng của tôi (Gói 4.1) — GET /customer/orders không nhận
// filter theo status (chỉ page/size/sort) nên không có bộ lọc trạng thái ở
// đây, tránh dựng UI filter không hoạt động thật. Gói 4.2 thêm nút hủy nhanh,
// Gói 5.1/5.2 thêm nút thanh toán ngay/lại — cả 2 đều thao tác thẳng trong
// danh sách, không bắt phải vào chi tiết đơn mới làm được.
function OrderListPage() {
  const [pageInfo, setPageInfo] = useState<Omit<PageResponse<OrderSummaryResponse>, 'content'> | null>(null)
  const [orders, setOrders] = useState<OrderSummaryResponse[]>([])
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null)
  const [payingOrderId, setPayingOrderId] = useState<number | null>(null)

  function loadOrders() {
    setIsLoading(true)
    setError(null)
    listOrders({ page: page - 1, size: PAGE_SIZE })
      .then((result) => {
        setOrders(result.content)
        setPageInfo(result)
      })
      .catch((err: unknown) => setError(getApiErrorMessage(err)))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    loadOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  async function handleCancelOrder(orderId: number) {
    if (!window.confirm(`Xác nhận hủy đơn hàng #${orderId}?`)) return
    setCancellingOrderId(orderId)
    setError(null)
    try {
      await cancelOrder(orderId)
      loadOrders()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể hủy đơn hàng'))
    } finally {
      setCancellingOrderId(null)
    }
  }

  // Điều hướng cả trang sang domain VNPay — không phải điều hướng SPA, nên
  // không cần loadOrders()/reset payingOrderId khi thành công (trang rời đi).
  async function handlePayNow(orderId: number) {
    setPayingOrderId(orderId)
    setError(null)
    try {
      const { paymentUrl } = await getPaymentUrl(orderId)
      window.location.href = paymentUrl
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tạo giao dịch thanh toán'))
      setPayingOrderId(null)
    }
  }

  return (
    <section>
      <div className={styles.header}>
        <h1>Đơn hàng của tôi</h1>
        {pageInfo && <span className={styles.countBadge}>{pageInfo.totalElements} đơn hàng</span>}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {isLoading ? (
        <p>Đang tải...</p>
      ) : orders.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Bạn chưa có đơn hàng nào.</p>
          <Link to="/products" className={styles.browseLink}>
            Bắt đầu mua sắm →
          </Link>
        </div>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <div className={styles.tableHeader}>
              <span>Mã đơn hàng</span>
              <span>Ngày đặt</span>
              <span className={styles.colRight}>Tổng tiền</span>
              <span>Thanh toán</span>
              <span>Trạng thái</span>
              <span>Thao tác</span>
            </div>

            <ul className={styles.rowList}>
              {orders.map((order) => (
                <li key={order.id} className={styles.row}>
                  <span className={styles.orderId}>#{order.id}</span>
                  <span className={styles.date}>{formatDate(order.createdAt)}</span>
                  <span className={styles.total}>{formatCurrency(order.totalAmount)}</span>
                  <span className={styles.paymentMethod}>{formatPaymentMethod(order.paymentMethod)}</span>
                  <span>
                    <OrderStatusBadge status={order.status} />
                  </span>
                  <div className={styles.actionsCell}>
                    <Link to={`/account/orders/${order.id}`} className={styles.detailLink}>
                      Xem chi tiết →
                    </Link>
                    {isOrderPayableOnline(order.status, order.paymentMethod) && (
                      <button
                        type="button"
                        className={styles.rowPayButton}
                        disabled={payingOrderId === order.id}
                        onClick={() => handlePayNow(order.id)}
                      >
                        {payingOrderId === order.id ? 'Đang chuyển...' : 'Thanh toán ngay'}
                      </button>
                    )}
                    {isOrderCancellableByCustomer(order.status) && (
                      <button
                        type="button"
                        className={styles.rowCancelButton}
                        disabled={cancellingOrderId === order.id}
                        onClick={() => handleCancelOrder(order.id)}
                      >
                        {cancellingOrderId === order.id ? 'Đang hủy...' : 'Hủy đơn'}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {pageInfo && pageInfo.totalPages > 1 && (
            <div className={styles.pagination}>
              <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
                ← Trước
              </button>
              <span>
                Trang {page} / {pageInfo.totalPages}
              </span>
              <button type="button" disabled={pageInfo.last} onClick={() => setPage((current) => current + 1)}>
                Sau →
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}

export default OrderListPage
