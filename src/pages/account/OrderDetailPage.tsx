import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import OrderStatusBadge from '../../components/order/OrderStatusBadge'
import OrderStatusStepper from '../../components/order/OrderStatusStepper'
import StarRatingInput from '../../components/review/StarRatingInput'
import { cancelOrder, getOrder } from '../../services/order/orderService'
import { createReturnRequest } from '../../services/order/returnRequestService'
import { createReview, getMyReview } from '../../services/review/reviewService'
import { formatCurrency } from '../../utils/currency'
import { formatDateTime } from '../../utils/date'
import { formatPaymentMethod, isOrderCancellableByCustomer } from '../../utils/orderStatus'
import { getApiErrorMessage } from '../../utils/apiError'
import type { OrderResponse } from '../../types/order/order'
import styles from './OrderDetailPage.module.css'

const PRODUCT_ICON = (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="5" width="18" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M1.5 19.5h21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

// Chi tiết đơn hàng — Gói 4.1 (xem), 4.2 (hủy đơn), 4.3 (yêu cầu trả hàng),
// 4.4 (viết đánh giá).
function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()

  const [order, setOrder] = useState<OrderResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isCancelling, setIsCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  const [isReturnFormOpen, setIsReturnFormOpen] = useState(false)
  const [returnReason, setReturnReason] = useState('')
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false)
  const [returnError, setReturnError] = useState<string | null>(null)

  const [reviewedProductIds, setReviewedProductIds] = useState<Set<number>>(new Set())
  const [openReviewProductId, setOpenReviewProductId] = useState<number | null>(null)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)

  function loadOrder(orderId: number) {
    setIsLoading(true)
    setError(null)
    return getOrder(orderId)
      .then(setOrder)
      .catch((err: unknown) => setError(getApiErrorMessage(err, 'Không tìm thấy đơn hàng')))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    if (!id) return
    loadOrder(Number(id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Chỉ đơn DELIVERED mới cho viết đánh giá — tra "đã review chưa" cho từng
  // sản phẩm trong đơn (theo productId, không phải productVariantId) để ẩn
  // nút với sản phẩm đã có review, tránh gọi API rồi mới báo lỗi trùng.
  useEffect(() => {
    if (!order || order.status !== 'DELIVERED') {
      setReviewedProductIds(new Set())
      return
    }
    const productIds = Array.from(
      new Set(order.items.map((item) => item.productId).filter((productId): productId is number => productId !== null)),
    )
    if (productIds.length === 0) return
    Promise.all(
      productIds.map((productId) => getMyReview(productId).then((review) => [productId, review !== null] as const)),
    )
      .then((results) => {
        setReviewedProductIds(new Set(results.filter(([, reviewed]) => reviewed).map(([productId]) => productId)))
      })
      .catch(() => {})
  }, [order])

  async function handleCancelOrder() {
    if (!order) return
    if (!window.confirm(`Xác nhận hủy đơn hàng #${order.id}?`)) return
    setIsCancelling(true)
    setCancelError(null)
    try {
      const updated = await cancelOrder(order.id)
      setOrder(updated)
    } catch (err) {
      setCancelError(getApiErrorMessage(err, 'Không thể hủy đơn hàng'))
    } finally {
      setIsCancelling(false)
    }
  }

  async function handleSubmitReturnRequest(event: FormEvent) {
    event.preventDefault()
    if (!order) return
    const reason = returnReason.trim()
    if (!reason) return
    setIsSubmittingReturn(true)
    setReturnError(null)
    try {
      await createReturnRequest(order.id, reason)
      setIsReturnFormOpen(false)
      setReturnReason('')
      await loadOrder(order.id)
    } catch (err) {
      setReturnError(getApiErrorMessage(err, 'Không thể gửi yêu cầu trả hàng'))
    } finally {
      setIsSubmittingReturn(false)
    }
  }

  function handleOpenReviewForm(productId: number) {
    setOpenReviewProductId(productId)
    setReviewRating(0)
    setReviewComment('')
    setReviewError(null)
  }

  async function handleSubmitReview(event: FormEvent, productId: number) {
    event.preventDefault()
    const comment = reviewComment.trim()
    if (reviewRating < 1 || !comment) return
    setIsSubmittingReview(true)
    setReviewError(null)
    try {
      await createReview(productId, { rating: reviewRating, comment })
      setReviewedProductIds((current) => new Set(current).add(productId))
      setOpenReviewProductId(null)
    } catch (err) {
      setReviewError(getApiErrorMessage(err, 'Không thể gửi đánh giá'))
    } finally {
      setIsSubmittingReview(false)
    }
  }

  if (isLoading) {
    return <p>Đang tải...</p>
  }

  if (error || !order) {
    return <p className={styles.error}>{error ?? 'Không tìm thấy đơn hàng'}</p>
  }

  const rawTotal = order.totalAmount + order.discountAmount
  const canCancel = isOrderCancellableByCustomer(order.status)
  // Viết đánh giá và yêu cầu trả hàng cùng chung điều kiện DELIVERED — 2 biến
  // riêng để đọc code rõ ý nghĩa từng chỗ dùng, dù giá trị hiện giống nhau.
  const canRequestReturn = order.status === 'DELIVERED'
  const canReview = order.status === 'DELIVERED'

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

        {(canCancel || canRequestReturn) && (
          <div className={styles.actionsRow}>
            {canCancel && (
              <button
                type="button"
                className={styles.cancelButton}
                disabled={isCancelling}
                onClick={handleCancelOrder}
              >
                {isCancelling ? 'Đang hủy...' : 'Hủy đơn hàng'}
              </button>
            )}
            {canRequestReturn && !isReturnFormOpen && (
              <button type="button" className={styles.returnButton} onClick={() => setIsReturnFormOpen(true)}>
                Yêu cầu trả hàng
              </button>
            )}
          </div>
        )}
        {cancelError && <p className={styles.actionError}>{cancelError}</p>}

        {isReturnFormOpen && (
          <form onSubmit={handleSubmitReturnRequest} className={styles.returnForm}>
            <label htmlFor="returnReason">Lý do trả hàng</label>
            <textarea
              id="returnReason"
              value={returnReason}
              maxLength={500}
              placeholder="Mô tả lý do bạn muốn trả hàng..."
              onChange={(event) => setReturnReason(event.target.value)}
            />
            {returnError && <p className={styles.actionError}>{returnError}</p>}
            <div className={styles.returnFormActions}>
              <button
                type="button"
                className={styles.returnFormCancel}
                onClick={() => {
                  setIsReturnFormOpen(false)
                  setReturnError(null)
                  setReturnReason('')
                }}
              >
                Hủy
              </button>
              <button type="submit" className={styles.returnFormSubmit} disabled={isSubmittingReturn || !returnReason.trim()}>
                {isSubmittingReturn ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className={styles.layout}>
        <div className={styles.main}>
          <section className={styles.section}>
            <h2>Sản phẩm đã đặt</h2>
            <ul className={styles.itemList}>
              {order.items.map((item) => (
                <li key={item.id} className={styles.item}>
                  <div className={styles.itemRow}>
                    <span className={styles.productIcon}>{PRODUCT_ICON}</span>
                    <div className={styles.itemInfo}>
                      <p className={styles.productName}>{item.productName}</p>
                      <p className={styles.variantMeta}>
                        {item.variantName} · SKU: {item.sku}
                      </p>
                    </div>
                    <span className={styles.itemQty}>× {item.quantity}</span>
                    <span className={styles.itemTotal}>{formatCurrency(item.lineTotal)}</span>
                  </div>

                  {canReview && item.productId !== null && (
                    <div className={styles.itemReviewAction}>
                      {reviewedProductIds.has(item.productId) ? (
                        <span className={styles.reviewedBadge}>✓ Đã đánh giá</span>
                      ) : (
                        openReviewProductId !== item.productId && (
                          <button
                            type="button"
                            className={styles.writeReviewButton}
                            onClick={() => handleOpenReviewForm(item.productId as number)}
                          >
                            Viết đánh giá
                          </button>
                        )
                      )}
                    </div>
                  )}

                  {openReviewProductId === item.productId && item.productId !== null && (
                    <form
                      onSubmit={(event) => handleSubmitReview(event, item.productId as number)}
                      className={styles.reviewForm}
                    >
                      <StarRatingInput value={reviewRating} onChange={setReviewRating} disabled={isSubmittingReview} />
                      <textarea
                        value={reviewComment}
                        maxLength={2000}
                        placeholder="Chia sẻ cảm nhận của bạn về sản phẩm này..."
                        onChange={(event) => setReviewComment(event.target.value)}
                      />
                      {reviewError && <p className={styles.actionError}>{reviewError}</p>}
                      <div className={styles.reviewFormActions}>
                        <button
                          type="button"
                          className={styles.returnFormCancel}
                          onClick={() => {
                            setOpenReviewProductId(null)
                            setReviewError(null)
                          }}
                        >
                          Hủy
                        </button>
                        <button
                          type="submit"
                          className={styles.returnFormSubmit}
                          disabled={isSubmittingReview || reviewRating < 1 || !reviewComment.trim()}
                        >
                          {isSubmittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
                        </button>
                      </div>
                    </form>
                  )}
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
