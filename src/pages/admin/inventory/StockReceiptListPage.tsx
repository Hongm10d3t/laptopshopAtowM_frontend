import { useEffect, useState } from 'react'
import InventorySectionNav from '../../../components/inventory/InventorySectionNav'
import { Link } from 'react-router-dom'
import { listStockReceipts } from '../../../services/inventory/stockReceiptService'
import { formatDateTime } from '../../../utils/date'
import { getApiErrorMessage } from '../../../utils/apiError'
import type { StockReceiptStatus, StockReceiptSummaryResponse } from '../../../types/inventory/stockReceipt'
import type { PageResponse } from '../../../types/common/pageResponse'
import styles from '../adminList.module.css'

const PAGE_SIZE = 10

const STATUS_LABELS: Record<StockReceiptStatus, string> = {
  DRAFT: 'Nháp',
  CONFIRMED: 'Đã xác nhận',
  CANCELLED: 'Đã huỷ',
}

const STATUS_CLASS: Record<StockReceiptStatus, string> = {
  DRAFT: styles.statusDraft,
  CONFIRMED: styles.statusConfirmed,
  CANCELLED: styles.statusCancelled,
}

function StockReceiptListPage() {
  const [pageInfo, setPageInfo] = useState<Omit<PageResponse<StockReceiptSummaryResponse>, 'content'> | null>(null)
  const [receipts, setReceipts] = useState<StockReceiptSummaryResponse[]>([])
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<'' | StockReceiptStatus>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsLoading(true)
    setError(null)
    listStockReceipts({ page: page - 1, size: PAGE_SIZE, status: status || undefined })
      .then((result) => {
        setReceipts(result.content)
        setPageInfo(result)
      })
      .catch((err: unknown) => setError(getApiErrorMessage(err)))
      .finally(() => setIsLoading(false))
  }, [page, status])

  return (
    <section>
      <InventorySectionNav />
      <div className={styles.header}>
        <h1>
          Phiếu nhập kho
          {pageInfo && <span className={styles.countBadge}>{pageInfo.totalElements} phiếu</span>}
        </h1>
        <Link to="/admin/inventory/receipts/new" className={styles.createButton}>
          + Tạo phiếu nhập
        </Link>
      </div>

      <div className={styles.toolbar}>
        <select value={status} onChange={(event) => { setStatus(event.target.value as '' | StockReceiptStatus); setPage(1) }}>
          <option value="">Tất cả trạng thái</option>
          <option value="DRAFT">Nháp</option>
          <option value="CONFIRMED">Đã xác nhận</option>
          <option value="CANCELLED">Đã huỷ</option>
        </select>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {isLoading ? (
        <p>Đang tải...</p>
      ) : receipts.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Chưa có phiếu nhập kho nào.</p>
        </div>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Mã phiếu</th>
                  <th>Ghi chú</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Ngày xác nhận</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((receipt) => (
                  <tr key={receipt.id}>
                    <td className={styles.nameCell}>{receipt.code}</td>
                    <td className={styles.mutedCell}>{receipt.note || '—'}</td>
                    <td>
                      <span className={STATUS_CLASS[receipt.status]}>{STATUS_LABELS[receipt.status]}</span>
                    </td>
                    <td className={styles.mutedCell}>{formatDateTime(receipt.createdAt)}</td>
                    <td className={styles.mutedCell}>{receipt.confirmedAt ? formatDateTime(receipt.confirmedAt) : '—'}</td>
                    <td>
                      <Link to={`/admin/inventory/receipts/${receipt.id}`} className={styles.linkButton}>
                        Xem chi tiết
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

export default StockReceiptListPage
