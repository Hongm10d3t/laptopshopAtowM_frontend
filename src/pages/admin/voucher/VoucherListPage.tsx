import { type FormEvent, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AdminActionDialog from '../../../components/admin/AdminActionDialog'
import VoucherStatusBadge from '../../../components/voucher/VoucherStatusBadge'
import {
  listAdminVouchers,
  updateAdminVoucher,
} from '../../../services/voucher/adminVoucherService'
import type { PageResponse } from '../../../types/common/pageResponse'
import type { AdminVoucherResponse } from '../../../types/voucher/adminVoucher'
import { getApiErrorMessage } from '../../../utils/apiError'
import { formatCurrency } from '../../../utils/currency'
import { formatDateTime } from '../../../utils/date'
import styles from '../AdminManagementPage.module.css'

const PAGE_SIZE = 20

function parsePage(value: string | null): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
}

function parseActive(value: string | null): boolean | undefined {
  if (value === 'true') return true
  if (value === 'false') return false
  return undefined
}

function toUpdatePayload(voucher: AdminVoucherResponse, active: boolean) {
  return {
    description: voucher.description ?? undefined,
    discountType: voucher.discountType,
    discountValue: voucher.discountValue,
    maxDiscountAmount: voucher.maxDiscountAmount ?? undefined,
    minOrderAmount: voucher.minOrderAmount,
    usageLimit: voucher.usageLimit ?? undefined,
    usageLimitPerUser: voucher.usageLimitPerUser ?? undefined,
    startAt: voucher.startAt,
    endAt: voucher.endAt,
    active,
  }
}

function formatDiscount(voucher: AdminVoucherResponse): string {
  return voucher.discountType === 'PERCENTAGE'
    ? `${voucher.discountValue}%`
    : formatCurrency(voucher.discountValue)
}

function VoucherListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedCode = searchParams.get('code')?.trim() || undefined
  const selectedActive = parseActive(searchParams.get('active'))
  const page = parsePage(searchParams.get('page'))

  const [codeInput, setCodeInput] = useState(selectedCode ?? '')
  const [vouchers, setVouchers] = useState<AdminVoucherResponse[]>([])
  const [pageInfo, setPageInfo] = useState<Omit<PageResponse<AdminVoucherResponse>, 'content'> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [selectedVoucher, setSelectedVoucher] = useState<AdminVoucherResponse | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    setCodeInput(selectedCode ?? '')
  }, [selectedCode])

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    listAdminVouchers({
      code: selectedCode,
      active: selectedActive,
      page: page - 1,
      size: PAGE_SIZE,
    })
      .then((result) => {
        if (cancelled) return
        setVouchers(result.content)
        setPageInfo(result)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getApiErrorMessage(err, 'Không thể tải danh sách voucher'))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [page, reloadKey, selectedActive, selectedCode])

  function setQuery(next: { code?: string; active?: boolean; page?: number }) {
    const params = new URLSearchParams()
    if (next.code) params.set('code', next.code)
    if (next.active !== undefined) params.set('active', String(next.active))
    if ((next.page ?? 1) > 1) params.set('page', String(next.page))
    setSearchParams(params)
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedCode = codeInput.trim().toUpperCase()
    setCodeInput(normalizedCode)
    setQuery({ code: normalizedCode || undefined, active: selectedActive, page: 1 })
  }

  function closeDialog() {
    if (isUpdating) return
    setSelectedVoucher(null)
    setActionError(null)
  }

  async function handleToggleStatus() {
    if (!selectedVoucher) return
    setIsUpdating(true)
    setActionError(null)

    try {
      const updated = await updateAdminVoucher(
        selectedVoucher.id,
        toUpdatePayload(selectedVoucher, !selectedVoucher.active),
      )
      setVouchers((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      setSelectedVoucher(null)
      setActionError(null)
      setReloadKey((value) => value + 1)
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Không thể cập nhật trạng thái voucher'))
    } finally {
      setIsUpdating(false)
    }
  }

  const hasFilters = Boolean(selectedCode || selectedActive !== undefined)

  return (
    <section>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Khuyến mãi</p>
          <h1>
            Voucher
            {pageInfo && <span className={styles.countBadge}>{pageInfo.totalElements} kết quả</span>}
          </h1>
          <p className={styles.description}>
            Tạo và quản lý điều kiện giảm giá. Mã voucher không thể thay đổi sau khi được tạo.
          </p>
        </div>
        <Link to="/admin/vouchers/new" className={styles.primaryButton}>
          + Tạo voucher
        </Link>
      </div>

      <form className={styles.toolbar} onSubmit={handleSearch}>
        <label className={styles.filterFieldWide}>
          <span>Mã voucher</span>
          <div className={styles.searchRow}>
            <input
              value={codeInput}
              onChange={(event) => setCodeInput(event.target.value.toUpperCase())}
              placeholder="Nhập chính xác mã, ví dụ SALE10"
              maxLength={50}
            />
            <button type="submit" className={styles.searchButton}>
              Tìm
            </button>
          </div>
        </label>
        <label className={styles.filterField}>
          <span>Trạng thái cấu hình</span>
          <select
            value={selectedActive === undefined ? '' : String(selectedActive)}
            onChange={(event) =>
              setQuery({
                code: selectedCode,
                active: parseActive(event.target.value),
                page: 1,
              })
            }
          >
            <option value="">Tất cả</option>
            <option value="true">Đang bật</option>
            <option value="false">Đã tắt</option>
          </select>
        </label>
        {hasFilters && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={() => {
              setCodeInput('')
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
          <button type="button" onClick={() => setReloadKey((value) => value + 1)}>
            Thử lại
          </button>
        </div>
      )}

      <div className={styles.tableWrapper}>
        <table className={`${styles.table} ${styles.tableWide}`}>
          <thead>
            <tr>
              <th>Mã</th>
              <th>Mức giảm</th>
              <th>Điều kiện đơn</th>
              <th>Lượt sử dụng</th>
              <th>Thời gian áp dụng</th>
              <th>Trạng thái</th>
              <th className={styles.actionHeader}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }, (_, index) => (
                <tr key={index} className={styles.skeletonRow}>
                  {Array.from({ length: 7 }, (_, cellIndex) => (
                    <td key={cellIndex}><span /></td>
                  ))}
                </tr>
              ))
            ) : vouchers.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className={styles.emptyState}>
                    <strong>Không có voucher phù hợp</strong>
                    <span>Thử xóa bộ lọc hoặc tạo voucher mới để bắt đầu chương trình khuyến mãi.</span>
                  </div>
                </td>
              </tr>
            ) : (
              vouchers.map((voucher) => (
                <tr key={voucher.id}>
                  <td>
                    <Link to={`/admin/vouchers/${voucher.id}/edit`} className={styles.link}>
                      {voucher.code}
                    </Link>
                    {voucher.description && (
                      <div className={styles.stackCell}>
                        <span>{voucher.description}</span>
                      </div>
                    )}
                  </td>
                  <td>
                    <div className={styles.stackCell}>
                      <strong>{formatDiscount(voucher)}</strong>
                      <span>
                        {voucher.discountType === 'PERCENTAGE' && voucher.maxDiscountAmount !== null
                          ? `Tối đa ${formatCurrency(voucher.maxDiscountAmount)}`
                          : voucher.discountType === 'PERCENTAGE'
                            ? 'Không giới hạn mức giảm'
                            : 'Giảm trực tiếp'}
                      </span>
                    </div>
                  </td>
                  <td className={styles.numericCell}>{formatCurrency(voucher.minOrderAmount)}</td>
                  <td>
                    <div className={styles.stackCell}>
                      <strong>
                        {voucher.usedCount} / {voucher.usageLimit ?? '∞'}
                      </strong>
                      <span>Mỗi khách: {voucher.usageLimitPerUser ?? 'Không giới hạn'}</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.stackCell}>
                      <strong>{formatDateTime(voucher.startAt)}</strong>
                      <span>đến {formatDateTime(voucher.endAt)}</span>
                    </div>
                  </td>
                  <td><VoucherStatusBadge voucher={voucher} /></td>
                  <td className={styles.actionCell}>
                    <div className={styles.actions}>
                      <Link to={`/admin/vouchers/${voucher.id}/edit`} className={styles.linkButton}>
                        Chỉnh sửa
                      </Link>
                      <button
                        type="button"
                        className={voucher.active ? styles.dangerLinkButton : styles.linkButton}
                        onClick={() => {
                          setSelectedVoucher(voucher)
                          setActionError(null)
                        }}
                      >
                        {voucher.active ? 'Tắt' : 'Bật lại'}
                      </button>
                    </div>
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
            onClick={() => setQuery({ code: selectedCode, active: selectedActive, page: page - 1 })}
          >
            ← Trước
          </button>
          <span>Trang <strong>{page}</strong> / {pageInfo.totalPages}</span>
          <button
            type="button"
            disabled={pageInfo.last}
            onClick={() => setQuery({ code: selectedCode, active: selectedActive, page: page + 1 })}
          >
            Sau →
          </button>
        </div>
      )}

      <AdminActionDialog
        open={selectedVoucher !== null}
        title={selectedVoucher?.active ? 'Tắt voucher?' : 'Bật lại voucher?'}
        description={
          selectedVoucher?.active
            ? 'Khách hàng sẽ không thể áp dụng mã này sau khi bạn tắt.'
            : 'Voucher chỉ có thể áp dụng nếu vẫn còn trong thời gian hiệu lực và chưa hết lượt sử dụng.'
        }
        confirmLabel={selectedVoucher?.active ? 'Tắt voucher' : 'Bật lại'}
        tone={selectedVoucher?.active ? 'danger' : 'primary'}
        isSubmitting={isUpdating}
        error={actionError}
        onClose={closeDialog}
        onConfirm={handleToggleStatus}
      >
        {selectedVoucher && (
          <div className={styles.dialogSummary}>
            <span>Mã: <strong>{selectedVoucher.code}</strong></span>
            <span>Mức giảm: <strong>{formatDiscount(selectedVoucher)}</strong></span>
          </div>
        )}
      </AdminActionDialog>
    </section>
  )
}

export default VoucherListPage
