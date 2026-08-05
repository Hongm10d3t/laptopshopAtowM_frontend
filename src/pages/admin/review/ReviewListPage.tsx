import { type FormEvent, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AdminActionDialog from '../../../components/admin/AdminActionDialog'
import ReviewStatusBadge from '../../../components/review/ReviewStatusBadge'
import StarRating from '../../../components/review/StarRating'
import {
  hideAdminReview,
  listAdminReviews,
  unhideAdminReview,
} from '../../../services/review/adminReviewService'
import type { PageResponse } from '../../../types/common/pageResponse'
import type { AdminReviewResponse, AdminReviewStatus } from '../../../types/review/adminReview'
import { getApiErrorMessage } from '../../../utils/apiError'
import { formatDateTime } from '../../../utils/date'
import styles from '../AdminManagementPage.module.css'

const PAGE_SIZE = 20

const STATUS_OPTIONS: Array<{ value: AdminReviewStatus; label: string }> = [
  { value: 'VISIBLE', label: 'Đang hiển thị' },
  { value: 'HIDDEN', label: 'Đã ẩn' },
]

function isStatus(value: string | null): value is AdminReviewStatus {
  return STATUS_OPTIONS.some((option) => option.value === value)
}

function parsePage(value: string | null): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
}

function parsePositiveInteger(value: string | null): number | undefined {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

function ReviewListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const statusParam = searchParams.get('status')
  const selectedStatus = isStatus(statusParam) ? statusParam : undefined
  const selectedProductId = parsePositiveInteger(searchParams.get('productId'))
  const page = parsePage(searchParams.get('page'))

  const [productIdInput, setProductIdInput] = useState(selectedProductId ? String(selectedProductId) : '')
  const [filterError, setFilterError] = useState<string | null>(null)
  const [reviews, setReviews] = useState<AdminReviewResponse[]>([])
  const [pageInfo, setPageInfo] = useState<Omit<PageResponse<AdminReviewResponse>, 'content'> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [selectedReview, setSelectedReview] = useState<AdminReviewResponse | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    setProductIdInput(selectedProductId ? String(selectedProductId) : '')
  }, [selectedProductId])

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    listAdminReviews({
      productId: selectedProductId,
      status: selectedStatus,
      page: page - 1,
      size: PAGE_SIZE,
    })
      .then((result) => {
        if (cancelled) return
        setReviews(result.content)
        setPageInfo(result)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getApiErrorMessage(err, 'Không thể tải danh sách đánh giá'))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [page, reloadKey, selectedProductId, selectedStatus])

  function setQuery(next: { productId?: number; status?: AdminReviewStatus; page?: number }) {
    const params = new URLSearchParams()
    if (next.productId) params.set('productId', String(next.productId))
    if (next.status) params.set('status', next.status)
    if ((next.page ?? 1) > 1) params.set('page', String(next.page))
    setSearchParams(params)
  }

  function handleProductFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFilterError(null)
    const normalized = productIdInput.trim()

    if (!normalized) {
      setQuery({ status: selectedStatus, page: 1 })
      return
    }

    const parsed = Number(normalized)
    if (!Number.isInteger(parsed) || parsed <= 0) {
      setFilterError('Mã sản phẩm phải là số nguyên dương')
      return
    }

    setQuery({ productId: parsed, status: selectedStatus, page: 1 })
  }

  function closeDialog() {
    if (isUpdating) return
    setSelectedReview(null)
    setActionError(null)
  }

  async function handleModeration() {
    if (!selectedReview) return
    setIsUpdating(true)
    setActionError(null)

    try {
      const updated = selectedReview.status === 'VISIBLE'
        ? await hideAdminReview(selectedReview.id)
        : await unhideAdminReview(selectedReview.id)
      setReviews((current) => current.map((review) => (review.id === updated.id ? updated : review)))
      setSelectedReview(null)
      setReloadKey((value) => value + 1)
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Không thể cập nhật trạng thái đánh giá'))
    } finally {
      setIsUpdating(false)
    }
  }

  const hasFilters = Boolean(selectedProductId || selectedStatus)

  return (
    <section>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Nội dung khách hàng</p>
          <h1>
            Kiểm duyệt đánh giá
            {pageInfo && <span className={styles.countBadge}>{pageInfo.totalElements} kết quả</span>}
          </h1>
          <p className={styles.description}>
            Ẩn nội dung không phù hợp hoặc khôi phục đánh giá đã ẩn. Hệ thống không cho phép quản trị viên sửa nội dung của khách hàng.
          </p>
        </div>
      </div>

      <div className={styles.notice}>
        <span className={styles.noticeIcon}>i</span>
        <span>Đánh giá bị ẩn sẽ không xuất hiện ở storefront và không được tính vào điểm trung bình của sản phẩm.</span>
      </div>

      <form className={styles.toolbar} onSubmit={handleProductFilter}>
        <label className={styles.filterFieldWide}>
          <span>Lọc theo mã sản phẩm</span>
          <div className={styles.searchRow}>
            <input
              inputMode="numeric"
              value={productIdInput}
              onChange={(event) => setProductIdInput(event.target.value)}
              placeholder="Ví dụ: 12"
            />
            <button type="submit" className={styles.searchButton}>Lọc</button>
          </div>
          {filterError && <span className={styles.filterError}>{filterError}</span>}
        </label>
        <label className={styles.filterField}>
          <span>Trạng thái hiển thị</span>
          <select
            value={selectedStatus ?? ''}
            onChange={(event) =>
              setQuery({
                productId: selectedProductId,
                status: isStatus(event.target.value) ? event.target.value : undefined,
                page: 1,
              })
            }
          >
            <option value="">Tất cả trạng thái</option>
            {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        {hasFilters && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={() => {
              setProductIdInput('')
              setFilterError(null)
              setQuery({ page: 1 })
            }}
          >
            Xóa bộ lọc
          </button>
        )}
      </form>

      {error && (
        <div className={styles.error} role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setReloadKey((value) => value + 1)}>Thử lại</button>
        </div>
      )}

      <div className={styles.tableWrapper}>
        <table className={`${styles.table} ${styles.tableWide}`}>
          <thead>
            <tr>
              <th>Đánh giá</th>
              <th>Nội dung</th>
              <th>Người viết</th>
              <th>Đối tượng</th>
              <th>Ngày tạo</th>
              <th>Trạng thái</th>
              <th className={styles.actionHeader}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }, (_, index) => (
                <tr key={index} className={styles.skeletonRow}>
                  {Array.from({ length: 7 }, (_, cellIndex) => <td key={cellIndex}><span /></td>)}
                </tr>
              ))
            ) : reviews.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className={styles.emptyState}>
                    <strong>Không có đánh giá phù hợp</strong>
                    <span>Thử thay đổi mã sản phẩm hoặc trạng thái hiển thị.</span>
                  </div>
                </td>
              </tr>
            ) : (
              reviews.map((review) => (
                <tr key={review.id}>
                  <td>
                    <div className={styles.ratingCell}>
                      <StarRating rating={review.rating} />
                      <strong>{review.rating}/5</strong>
                    </div>
                    <span className={styles.mutedCell}>#{review.id}</span>
                  </td>
                  <td className={styles.commentCell}>
                    <p className={styles.commentText}>{review.comment}</p>
                    {review.comment.length > 140 && (
                      <details className={styles.commentDetails}>
                        <summary>Xem đầy đủ</summary>
                        <p>{review.comment}</p>
                      </details>
                    )}
                  </td>
                  <td>
                    <div className={styles.stackCell}>
                      <Link to={`/admin/users/${review.userId}`} className={styles.link}>
                        {review.reviewerName || `Người dùng #${review.userId}`}
                      </Link>
                      <span>User #{review.userId}</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.stackCell}>
                      <Link to={`/admin/products/${review.productId}`} className={styles.link}>
                        Sản phẩm #{review.productId}
                      </Link>
                      <Link to={`/admin/orders/${review.orderId}`} className={styles.link}>
                        Đơn #{review.orderId}
                      </Link>
                    </div>
                  </td>
                  <td className={styles.mutedCell}>{formatDateTime(review.createdAt)}</td>
                  <td><ReviewStatusBadge status={review.status} /></td>
                  <td className={styles.actionCell}>
                    <button
                      type="button"
                      className={review.status === 'VISIBLE' ? styles.dangerLinkButton : styles.linkButton}
                      onClick={() => {
                        setSelectedReview(review)
                        setActionError(null)
                      }}
                    >
                      {review.status === 'VISIBLE' ? 'Ẩn đánh giá' : 'Hiện lại'}
                    </button>
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
            onClick={() => setQuery({ productId: selectedProductId, status: selectedStatus, page: page - 1 })}
          >
            ← Trước
          </button>
          <span>Trang <strong>{page}</strong> / {pageInfo.totalPages}</span>
          <button
            type="button"
            disabled={pageInfo.last}
            onClick={() => setQuery({ productId: selectedProductId, status: selectedStatus, page: page + 1 })}
          >
            Sau →
          </button>
        </div>
      )}

      <AdminActionDialog
        open={selectedReview !== null}
        title={selectedReview?.status === 'VISIBLE' ? 'Ẩn đánh giá này?' : 'Hiện lại đánh giá này?'}
        description={
          selectedReview?.status === 'VISIBLE'
            ? 'Đánh giá sẽ bị ẩn khỏi trang sản phẩm và không còn được tính trong điểm trung bình.'
            : 'Đánh giá sẽ xuất hiện lại trên storefront và được tính vào điểm trung bình của sản phẩm.'
        }
        confirmLabel={selectedReview?.status === 'VISIBLE' ? 'Ẩn đánh giá' : 'Hiện lại'}
        tone={selectedReview?.status === 'VISIBLE' ? 'danger' : 'primary'}
        isSubmitting={isUpdating}
        error={actionError}
        onClose={closeDialog}
        onConfirm={handleModeration}
      >
        {selectedReview && (
          <>
            <div className={styles.dialogSummary}>
              <span>Người viết: <strong>{selectedReview.reviewerName || `User #${selectedReview.userId}`}</strong></span>
              <span>Sản phẩm: <strong>#{selectedReview.productId}</strong></span>
              <span>Điểm: <strong>{selectedReview.rating}/5</strong></span>
            </div>
            <p className={styles.dialogComment}>{selectedReview.comment}</p>
          </>
        )}
      </AdminActionDialog>
    </section>
  )
}

export default ReviewListPage
