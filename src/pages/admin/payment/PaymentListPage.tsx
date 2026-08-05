import { type FormEvent, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PaymentStatusBadge from '../../../components/payment/PaymentStatusBadge'
import { listAdminPayments } from '../../../services/payment/adminPaymentService'
import type { PageResponse } from '../../../types/common/pageResponse'
import type { PaymentStatus } from '../../../types/order/order'
import type { PaymentResponse } from '../../../types/payment/payment'
import { getApiErrorMessage } from '../../../utils/apiError'
import { formatCurrency } from '../../../utils/currency'
import { formatDateTime } from '../../../utils/date'
import styles from './PaymentListPage.module.css'

const PAGE_SIZE = 20

const PAYMENT_STATUS_OPTIONS: Array<{
  value: PaymentStatus
  label: string
}> = [
  { value: 'PENDING', label: 'Chưa thanh toán' },
  { value: 'PAID', label: 'Đã thanh toán' },
  { value: 'FAILED', label: 'Thanh toán thất bại' },
  { value: 'CANCELLED', label: 'Đã hủy thanh toán' },
]

function isPaymentStatus(value: string | null): value is PaymentStatus {
  return PAYMENT_STATUS_OPTIONS.some((option) => option.value === value)
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

function getPaymentMilestone(payment: PaymentResponse): {
  label: string
  value: string
} {
  if (payment.status === 'PAID' && payment.paidAt) {
    return { label: 'Thanh toán lúc', value: formatDateTime(payment.paidAt) }
  }

  if (payment.status === 'PENDING') {
    return { label: 'Hạn phiên', value: formatDateTime(payment.expiresAt) }
  }

  return { label: 'Khởi tạo lúc', value: formatDateTime(payment.createdAt) }
}

function PaymentListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const statusParam = searchParams.get('status')
  const selectedStatus = isPaymentStatus(statusParam)
    ? statusParam
    : undefined
  const selectedOrderId = parsePositiveInteger(searchParams.get('orderId'))
  const page = parsePage(searchParams.get('page'))

  const [orderIdInput, setOrderIdInput] = useState(
    selectedOrderId ? String(selectedOrderId) : '',
  )
  const [payments, setPayments] = useState<PaymentResponse[]>([])
  const [pageInfo, setPageInfo] = useState<
    Omit<PageResponse<PaymentResponse>, 'content'> | null
  >(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterError, setFilterError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    setOrderIdInput(selectedOrderId ? String(selectedOrderId) : '')
  }, [selectedOrderId])

  useEffect(() => {
    let isCancelled = false
    setIsLoading(true)
    setError(null)

    listAdminPayments({
      status: selectedStatus,
      orderId: selectedOrderId,
      page: page - 1,
      size: PAGE_SIZE,
    })
      .then((result) => {
        if (isCancelled) return
        setPayments(result.content)
        setPageInfo(result)
      })
      .catch((err: unknown) => {
        if (!isCancelled) {
          setError(
            getApiErrorMessage(err, 'Không thể tải danh sách thanh toán'),
          )
        }
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false)
      })

    return () => {
      isCancelled = true
    }
  }, [page, reloadKey, selectedOrderId, selectedStatus])

  function setQuery(next: {
    status?: PaymentStatus
    orderId?: number
    page?: number
  }) {
    const params = new URLSearchParams()

    if (next.status) params.set('status', next.status)
    if (next.orderId) params.set('orderId', String(next.orderId))

    const nextPage = next.page ?? 1
    if (nextPage > 1) params.set('page', String(nextPage))

    setSearchParams(params)
  }

  function handleStatusChange(value: string) {
    setQuery({
      status: isPaymentStatus(value) ? value : undefined,
      orderId: selectedOrderId,
      page: 1,
    })
  }

  function handleOrderFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFilterError(null)

    const normalized = orderIdInput.trim()
    if (!normalized) {
      setQuery({ status: selectedStatus, page: 1 })
      return
    }

    const parsed = Number(normalized)
    if (!Number.isInteger(parsed) || parsed <= 0) {
      setFilterError('Mã đơn hàng phải là số nguyên dương')
      return
    }

    setQuery({ status: selectedStatus, orderId: parsed, page: 1 })
  }

  function clearFilters() {
    setOrderIdInput('')
    setFilterError(null)
    setQuery({ page: 1 })
  }

  const hasFilters = Boolean(selectedStatus || selectedOrderId)

  return (
    <section>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Đối soát</p>
          <h1>
            Thanh toán
            {pageInfo && (
              <span className={styles.countBadge}>
                {pageInfo.totalElements} giao dịch
              </span>
            )}
          </h1>
          <p className={styles.description}>
            Tra cứu trạng thái thanh toán online do Backend xác nhận từ VNPay.
            Màn hình này chỉ đọc, không cho sửa trạng thái thủ công.
          </p>
        </div>
      </div>

      <div className={styles.readOnlyNotice}>
        <span className={styles.noticeIcon} aria-hidden="true">i</span>
        <span>
          Trạng thái <strong>Đã thanh toán</strong> chỉ xuất hiện sau khi IPN
          được Backend xác thực thành công.
        </span>
      </div>

      <form className={styles.toolbar} onSubmit={handleOrderFilterSubmit}>
        <label className={styles.filterField}>
          <span>Trạng thái thanh toán</span>
          <select
            value={selectedStatus ?? ''}
            onChange={(event) => handleStatusChange(event.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            {PAYMENT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className={`${styles.filterField} ${styles.orderFilterField}`}>
          <span>Mã đơn hàng chính xác</span>
          <div className={styles.orderSearchRow}>
            <input
              type="number"
              min="1"
              step="1"
              value={orderIdInput}
              placeholder="Ví dụ: 18"
              onChange={(event) => {
                setOrderIdInput(event.target.value)
                setFilterError(null)
              }}
            />
            <button type="submit" className={styles.searchButton}>
              Tra cứu
            </button>
          </div>
          {filterError && <small className={styles.filterError}>{filterError}</small>}
        </label>

        {hasFilters && (
          <button
            type="button"
            className={styles.clearFilterButton}
            onClick={clearFilters}
          >
            Xóa bộ lọc
          </button>
        )}
      </form>

      {error && (
        <div className={styles.error} role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setReloadKey((value) => value + 1)}>
            Thử lại
          </button>
        </div>
      )}

      <div className={styles.tableWrapper} aria-busy={isLoading}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Mã giao dịch</th>
              <th>Đơn hàng</th>
              <th>Khởi tạo</th>
              <th className={styles.alignRight}>Số tiền</th>
              <th>Trạng thái</th>
              <th>Mốc xử lý</th>
              <th>Mã VNPay</th>
              <th className={styles.actionHeader}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }, (_, index) => (
                <tr key={index} className={styles.skeletonRow}>
                  {Array.from({ length: 8 }, (_, cellIndex) => (
                    <td key={cellIndex}><span /></td>
                  ))}
                </tr>
              ))
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className={styles.emptyState}>
                    <strong>Không có giao dịch phù hợp</strong>
                    <span>
                      Kiểm tra lại trạng thái hoặc mã đơn hàng đã nhập.
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              payments.map((payment) => {
                const milestone = getPaymentMilestone(payment)

                return (
                  <tr key={payment.id}>
                    <td>
                      <Link
                        to={`/admin/payments/${payment.id}`}
                        className={styles.paymentLink}
                      >
                        #{payment.id}
                      </Link>
                    </td>
                    <td>
                      <Link
                        to={`/admin/orders/${payment.orderId}`}
                        className={styles.orderLink}
                      >
                        Đơn #{payment.orderId}
                      </Link>
                    </td>
                    <td className={styles.mutedCell}>
                      {formatDateTime(payment.createdAt)}
                    </td>
                    <td className={`${styles.amountCell} ${styles.alignRight}`}>
                      {formatCurrency(payment.amount)}
                    </td>
                    <td>
                      <PaymentStatusBadge status={payment.status} />
                    </td>
                    <td>
                      <div className={styles.milestoneCell}>
                        <span>{milestone.label}</span>
                        <strong>{milestone.value}</strong>
                      </div>
                    </td>
                    <td className={styles.transactionCell}>
                      {payment.gatewayTransactionNo ?? '—'}
                    </td>
                    <td className={styles.actionCell}>
                      <Link
                        to={`/admin/payments/${payment.id}`}
                        className={styles.detailLink}
                      >
                        Xem chi tiết →
                      </Link>
                    </td>
                  </tr>
                )
              })
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
              setQuery({
                status: selectedStatus,
                orderId: selectedOrderId,
                page: page - 1,
              })
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
              setQuery({
                status: selectedStatus,
                orderId: selectedOrderId,
                page: page + 1,
              })
            }
          >
            Sau →
          </button>
        </div>
      )}
    </section>
  )
}

export default PaymentListPage
