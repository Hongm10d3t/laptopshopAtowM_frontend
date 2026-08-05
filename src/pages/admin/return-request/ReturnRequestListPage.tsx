import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ReturnRequestStatusBadge from '../../../components/order/ReturnRequestStatusBadge'
import { listAdminReturnRequests } from '../../../services/order/adminReturnRequestService'
import type { PageResponse } from '../../../types/common/pageResponse'
import type {
  ReturnRequestResponse,
  ReturnRequestStatus,
} from '../../../types/order/returnRequest'
import { getApiErrorMessage } from '../../../utils/apiError'
import { formatDateTime } from '../../../utils/date'
import styles from './ReturnRequestListPage.module.css'

const PAGE_SIZE = 20

const STATUS_OPTIONS: Array<{
  value: ReturnRequestStatus
  label: string
}> = [
  { value: 'REQUESTED', label: 'Chờ xử lý' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'REJECTED', label: 'Đã từ chối' },
]

function isReturnRequestStatus(
  value: string | null,
): value is ReturnRequestStatus {
  return STATUS_OPTIONS.some((option) => option.value === value)
}

function parsePage(value: string | null): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
}

function ReturnRequestListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const statusParam = searchParams.get('status')
  const selectedStatus = isReturnRequestStatus(statusParam)
    ? statusParam
    : undefined
  const page = parsePage(searchParams.get('page'))

  const [requests, setRequests] = useState<ReturnRequestResponse[]>([])
  const [pageInfo, setPageInfo] = useState<
    Omit<PageResponse<ReturnRequestResponse>, 'content'> | null
  >(null)
  const [isLoading, setIsLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isCancelled = false

    setIsLoading(true)
    setError(null)

    listAdminReturnRequests({
      status: selectedStatus,
      page: page - 1,
      size: PAGE_SIZE,
    })
      .then((result) => {
        if (isCancelled) return
        setRequests(result.content)
        setPageInfo(result)
      })
      .catch((err: unknown) => {
        if (!isCancelled) {
          setError(
            getApiErrorMessage(err, 'Không thể tải danh sách yêu cầu trả hàng'),
          )
        }
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false)
      })

    return () => {
      isCancelled = true
    }
  }, [page, reloadKey, selectedStatus])

  function updateQuery(next: {
    status?: ReturnRequestStatus
    page?: number
  }) {
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
      status: isReturnRequestStatus(value) ? value : undefined,
      page: 1,
    })
  }

  return (
    <section>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Hậu mãi</p>
          <h1>
            Yêu cầu trả hàng
            {pageInfo && (
              <span className={styles.countBadge}>
                {pageInfo.totalElements} yêu cầu
              </span>
            )}
          </h1>
          <p className={styles.description}>
            Kiểm tra lý do, đơn hàng liên quan và kết quả xử lý của từng yêu
            cầu.
          </p>
        </div>
      </div>

      <div className={styles.toolbar}>
        <label className={styles.filterField}>
          <span>Trạng thái yêu cầu</span>
          <select
            value={selectedStatus ?? ''}
            onChange={(event) => handleStatusChange(event.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            {STATUS_OPTIONS.map((option) => (
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
          <button type="button" onClick={() => setReloadKey((key) => key + 1)}>
            Thử lại
          </button>
        </div>
      )}

      <div className={styles.tableWrapper} aria-busy={isLoading}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Mã yêu cầu</th>
              <th>Đơn hàng</th>
              <th>Khách hàng</th>
              <th>Lý do</th>
              <th>Ngày gửi</th>
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
                  <td><span /></td>
                </tr>
              ))
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className={styles.emptyState}>
                    <strong>Không có yêu cầu trả hàng phù hợp</strong>
                    <span>Hãy thử chọn trạng thái khác.</span>
                  </div>
                </td>
              </tr>
            ) : (
              requests.map((request) => (
                <tr key={request.id}>
                  <td>
                    <Link
                      to={`/admin/return-requests/${request.id}`}
                      className={styles.requestLink}
                    >
                      #{request.id}
                    </Link>
                  </td>
                  <td>
                    <Link
                      to={`/admin/orders/${request.orderId}`}
                      className={styles.orderLink}
                    >
                      Đơn #{request.orderId}
                    </Link>
                  </td>
                  <td className={styles.mutedCell}>User #{request.userId}</td>
                  <td>
                    <span className={styles.reasonCell} title={request.reason}>
                      {request.reason}
                    </span>
                  </td>
                  <td className={styles.mutedCell}>
                    {formatDateTime(request.createdAt)}
                  </td>
                  <td>
                    <ReturnRequestStatusBadge status={request.status} />
                  </td>
                  <td className={styles.actionCell}>
                    <Link
                      to={`/admin/return-requests/${request.id}`}
                      className={styles.detailLink}
                    >
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
            onClick={() =>
              updateQuery({ status: selectedStatus, page: page - 1 })
            }
          >
            ← Trước
          </button>
          <span>
            Trang <strong>{page}</strong> / {pageInfo.totalPages}
          </span>
          <button
            type="button"
            disabled={pageInfo.last}
            onClick={() =>
              updateQuery({ status: selectedStatus, page: page + 1 })
            }
          >
            Sau →
          </button>
        </div>
      )}
    </section>
  )
}

export default ReturnRequestListPage
