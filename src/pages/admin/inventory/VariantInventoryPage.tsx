import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import InventorySectionNav from '../../../components/inventory/InventorySectionNav'
import { adjustInventory, getBalance, listMovements } from '../../../services/inventory/inventoryService'
import type { PageResponse } from '../../../types/common/pageResponse'
import type {
  InventoryBalanceResponse,
  InventoryMovementResponse,
  InventoryMovementType,
} from '../../../types/inventory/inventory'
import { getApiErrorMessage } from '../../../utils/apiError'
import { formatDateTime } from '../../../utils/date'
import styles from './VariantInventoryPage.module.css'

const PAGE_SIZE = 10

type AdjustmentDirection = 'increase' | 'decrease'

interface InventoryLocationState {
  productId?: number
  productName?: string
  variantName?: string | null
}

const MOVEMENT_TYPE_LABELS: Record<InventoryMovementType, string> = {
  RECEIPT: 'Nhập kho',
  RESERVE: 'Giữ cho đơn hàng',
  RELEASE: 'Giải phóng giữ hàng',
  SHIPMENT: 'Xuất giao khách',
  RETURN: 'Nhận hàng trả lại',
  ADJUSTMENT_IN: 'Điều chỉnh tăng',
  ADJUSTMENT_OUT: 'Điều chỉnh giảm',
}

const MOVEMENT_SIGN: Record<InventoryMovementType, 1 | -1 | 0> = {
  RECEIPT: 1,
  RESERVE: 0,
  RELEASE: 0,
  SHIPMENT: -1,
  RETURN: 1,
  ADJUSTMENT_IN: 1,
  ADJUSTMENT_OUT: -1,
}

function VariantInventoryPage() {
  const { variantId } = useParams<{ variantId: string }>()
  const variantIdNum = Number(variantId)
  const location = useLocation()
  const locationState = (location.state ?? {}) as InventoryLocationState

  const [balance, setBalance] = useState<InventoryBalanceResponse | null>(null)
  const [movementPage, setMovementPage] = useState<Omit<PageResponse<InventoryMovementResponse>, 'content'> | null>(null)
  const [movements, setMovements] = useState<InventoryMovementResponse[]>([])
  const [page, setPage] = useState(1)
  const [movementType, setMovementType] = useState<'' | InventoryMovementType>('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const [direction, setDirection] = useState<AdjustmentDirection>('increase')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [isAdjusting, setIsAdjusting] = useState(false)
  const [adjustError, setAdjustError] = useState<string | null>(null)
  const [adjustSuccess, setAdjustSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!Number.isInteger(variantIdNum) || variantIdNum <= 0) {
      setBalance(null)
      setLoadError('Mã SKU không hợp lệ')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setLoadError(null)
    Promise.all([
      getBalance(variantIdNum),
      listMovements(variantIdNum, {
        type: movementType || undefined,
        page: page - 1,
        size: PAGE_SIZE,
      }),
    ])
      .then(([balanceResult, movementResult]) => {
        setBalance(balanceResult)
        setMovements(movementResult.content)
        setMovementPage(movementResult)
      })
      .catch((err: unknown) => setLoadError(getApiErrorMessage(err, 'Không thể tải dữ liệu tồn kho')))
      .finally(() => setIsLoading(false))
  }, [variantIdNum, page, movementType, reloadKey])

  const quantityNumber = Number(quantity)
  const signedDelta = direction === 'increase' ? quantityNumber : -quantityNumber
  const projected = useMemo(() => {
    if (!balance || !Number.isInteger(quantityNumber) || quantityNumber <= 0) {
      return null
    }
    const onHand = balance.onHandQuantity + signedDelta
    return {
      onHand,
      available: onHand - balance.reservedQuantity,
      isValid: onHand >= balance.reservedQuantity,
    }
  }, [balance, quantityNumber, signedDelta])

  async function handleAdjustSubmit(event: FormEvent) {
    event.preventDefault()
    setAdjustError(null)
    setAdjustSuccess(null)

    if (!Number.isInteger(quantityNumber) || quantityNumber <= 0) {
      setAdjustError('Số lượng điều chỉnh phải là số nguyên dương')
      return
    }
    if (!reason.trim()) {
      setAdjustError('Vui lòng nhập lý do điều chỉnh')
      return
    }
    if (!projected?.isValid) {
      setAdjustError('Tồn thực tế sau điều chỉnh không thể thấp hơn số lượng đang giữ cho đơn hàng')
      return
    }

    setIsAdjusting(true)
    try {
      const updated = await adjustInventory(variantIdNum, {
        delta: signedDelta,
        reason: reason.trim(),
      })
      setBalance(updated)
      setQuantity('')
      setReason('')
      setAdjustSuccess(
        direction === 'increase'
          ? `Đã tăng ${quantityNumber} sản phẩm vào tồn kho.`
          : `Đã giảm ${quantityNumber} sản phẩm khỏi tồn kho.`,
      )
      setPage(1)
      setReloadKey((current) => current + 1)
    } catch (err) {
      setAdjustError(getApiErrorMessage(err, 'Không thể điều chỉnh tồn kho'))
    } finally {
      setIsAdjusting(false)
    }
  }

  if (isLoading && !balance) {
    return (
      <section>
        <InventorySectionNav />
        <div className={styles.loadingState}>
          <span className={styles.spinner} aria-hidden="true" />
          Đang tải chi tiết tồn kho...
        </div>
      </section>
    )
  }

  if (!balance) {
    return (
      <section>
        <InventorySectionNav />
        <div className={styles.notFound}>
          <h1>Không thể mở tồn kho</h1>
          <p>{loadError ?? 'Không tìm thấy SKU được yêu cầu.'}</p>
          <Link to="/admin/inventory">Quay lại kho hàng</Link>
        </div>
      </section>
    )
  }

  const isInStock = balance.availableQuantity > 0

  return (
    <section>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.breadcrumbs}>
            <Link to="/admin/inventory">Kho hàng</Link>
            <span>/</span>
            <span>{balance.sku}</span>
          </div>
          <div className={styles.titleRow}>
            <h1>Chi tiết tồn kho</h1>
            <span className={isInStock ? styles.inStockBadge : styles.outOfStockBadge}>
              {isInStock ? 'Có thể bán' : 'Hết hàng khả dụng'}
            </span>
          </div>
          <p className={styles.subtitle}>
            <strong>SKU {balance.sku}</strong>
            {locationState.variantName ? ` · ${locationState.variantName}` : ''}
            {locationState.productName ? ` · ${locationState.productName}` : ''}
          </p>
        </div>
        <div className={styles.headerActions}>
          {locationState.productId && (
            <Link to={`/admin/products/${locationState.productId}`} className={styles.secondaryButton}>
              Xem sản phẩm
            </Link>
          )}
          <Link to="/admin/inventory/receipts/new" className={styles.primaryButton}>
            ＋ Tạo phiếu nhập
          </Link>
        </div>
      </div>

      <InventorySectionNav />

      {loadError && (
        <div className={styles.warningBanner} role="alert">
          <span>{loadError}</span>
          <button type="button" onClick={() => setReloadKey((current) => current + 1)}>Tải lại</button>
        </div>
      )}

      <div className={styles.balanceGrid}>
        <BalanceCard
          label="Tồn thực tế"
          value={balance.onHandQuantity}
          note="Số lượng vật lý đang ghi nhận trong kho"
          icon="box"
        />
        <BalanceCard
          label="Đang giữ"
          value={balance.reservedQuantity}
          note="Đã dành cho các đơn hàng chưa xuất kho"
          icon="lock"
        />
        <BalanceCard
          label="Có thể bán"
          value={balance.availableQuantity}
          note="Số lượng còn có thể nhận đơn mới"
          icon="check"
          emphasis
        />
      </div>

      <div className={styles.stockEquation} aria-label="Cách tính tồn kho khả dụng">
        <span><strong>{balance.onHandQuantity}</strong><small>Tồn thực tế</small></span>
        <b>−</b>
        <span><strong>{balance.reservedQuantity}</strong><small>Đang giữ</small></span>
        <b>=</b>
        <span className={styles.equationResult}><strong>{balance.availableQuantity}</strong><small>Có thể bán</small></span>
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.historyCard}>
          <div className={styles.cardHeader}>
            <div>
              <h2>Lịch sử biến động</h2>
              <p>Mọi lần nhập, giữ, xuất, trả hoặc điều chỉnh đều được backend ghi lại.</p>
            </div>
            <select
              value={movementType}
              onChange={(event) => {
                setMovementType(event.target.value as '' | InventoryMovementType)
                setPage(1)
              }}
              aria-label="Lọc loại biến động"
            >
              <option value="">Tất cả biến động</option>
              {(Object.keys(MOVEMENT_TYPE_LABELS) as InventoryMovementType[]).map((type) => (
                <option key={type} value={type}>{MOVEMENT_TYPE_LABELS[type]}</option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <div className={styles.tableLoading}>Đang cập nhật lịch sử...</div>
          ) : movements.length === 0 ? (
            <div className={styles.emptyHistory}>
              <h3>Chưa có biến động phù hợp</h3>
              <p>{movementType ? 'Hãy chọn loại biến động khác.' : 'SKU này chưa phát sinh giao dịch kho.'}</p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>Loại</th>
                    <th>Thay đổi</th>
                    <th>Sau biến động</th>
                    <th>Tham chiếu / Lý do</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((movement) => {
                    const sign = MOVEMENT_SIGN[movement.type]
                    const displayQuantity = sign === 0
                      ? movement.quantity
                      : sign > 0
                        ? `+${movement.quantity}`
                        : `-${movement.quantity}`
                    return (
                      <tr key={movement.id}>
                        <td className={styles.timeCell}>{formatDateTime(movement.createdAt)}</td>
                        <td>
                          <span className={`${styles.movementBadge} ${styles[`movement${movement.type}`]}`}>
                            {MOVEMENT_TYPE_LABELS[movement.type]}
                          </span>
                        </td>
                        <td className={sign < 0 ? styles.negativeQuantity : sign > 0 ? styles.positiveQuantity : styles.neutralQuantity}>
                          {displayQuantity}
                        </td>
                        <td>
                          <div className={styles.afterValues}>
                            <span><strong>{movement.onHandAfter}</strong> thực tế</span>
                            <span><strong>{movement.reservedAfter}</strong> đang giữ</span>
                          </div>
                        </td>
                        <td className={styles.referenceCell}>
                          {movement.referenceType && movement.referenceId ? (
                            <small>{movement.referenceType} #{movement.referenceId}</small>
                          ) : null}
                          <span>{movement.reason || '—'}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {movementPage && movementPage.totalPages > 1 && (
            <div className={styles.pagination}>
              <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
                ← Trước
              </button>
              <span>Trang {page} / {movementPage.totalPages}</span>
              <button type="button" disabled={movementPage.last} onClick={() => setPage((current) => current + 1)}>
                Sau →
              </button>
            </div>
          )}
        </div>

        <aside className={styles.adjustCard}>
          <div className={styles.cardHeaderCompact}>
            <span className={styles.adjustIcon} aria-hidden="true">±</span>
            <div>
              <h2>Điều chỉnh thủ công</h2>
              <p>Dùng khi kiểm kê phát hiện chênh lệch. Nhập hàng thông thường nên dùng phiếu nhập.</p>
            </div>
          </div>

          <form onSubmit={handleAdjustSubmit}>
            <fieldset className={styles.directionSelector}>
              <legend>Loại điều chỉnh</legend>
              <label className={direction === 'increase' ? styles.directionActive : styles.directionOption}>
                <input
                  type="radio"
                  name="direction"
                  value="increase"
                  checked={direction === 'increase'}
                  onChange={() => {
                    setDirection('increase')
                    setAdjustError(null)
                    setAdjustSuccess(null)
                  }}
                />
                <span>＋ Tăng tồn</span>
              </label>
              <label className={direction === 'decrease' ? styles.directionDangerActive : styles.directionOption}>
                <input
                  type="radio"
                  name="direction"
                  value="decrease"
                  checked={direction === 'decrease'}
                  onChange={() => {
                    setDirection('decrease')
                    setAdjustError(null)
                    setAdjustSuccess(null)
                  }}
                />
                <span>− Giảm tồn</span>
              </label>
            </fieldset>

            <label className={styles.field}>
              <span>Số lượng</span>
              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(event) => {
                  setQuantity(event.target.value)
                  setAdjustError(null)
                  setAdjustSuccess(null)
                }}
                placeholder="Nhập số lượng"
                inputMode="numeric"
              />
            </label>

            <label className={styles.field}>
              <span>Lý do điều chỉnh</span>
              <textarea
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value)
                  setAdjustError(null)
                  setAdjustSuccess(null)
                }}
                maxLength={255}
                rows={3}
                placeholder="Ví dụ: Kiểm kê thực tế thiếu 2 sản phẩm"
              />
              <small>{reason.length}/255 ký tự</small>
            </label>

            {projected && (
              <div className={projected.isValid ? styles.previewBox : styles.previewError}>
                <span>Sau điều chỉnh</span>
                <div>
                  <strong>{projected.onHand}</strong> tồn thực tế
                  <b>·</b>
                  <strong>{projected.available}</strong> có thể bán
                </div>
                {!projected.isValid && <small>Không được thấp hơn {balance.reservedQuantity} sản phẩm đang giữ.</small>}
              </div>
            )}

            {adjustError && <p className={styles.formError} role="alert">{adjustError}</p>}
            {adjustSuccess && <p className={styles.formSuccess} role="status">{adjustSuccess}</p>}

            <button
              type="submit"
              className={direction === 'decrease' ? styles.dangerSubmit : styles.submitButton}
              disabled={isAdjusting || Boolean(projected && !projected.isValid)}
            >
              {isAdjusting ? 'Đang cập nhật...' : direction === 'increase' ? 'Xác nhận tăng tồn' : 'Xác nhận giảm tồn'}
            </button>
          </form>

          <div className={styles.adjustNote}>
            <strong>Lưu ý</strong>
            <p>Không thể giảm tồn thực tế xuống thấp hơn số lượng đã giữ cho các đơn hàng hiện tại.</p>
          </div>
        </aside>
      </div>
    </section>
  )
}

interface BalanceCardProps {
  label: string
  value: number
  note: string
  icon: 'box' | 'lock' | 'check'
  emphasis?: boolean
}

function BalanceCard({ label, value, note, icon, emphasis = false }: BalanceCardProps) {
  const icons = {
    box: (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M3 6.1 10 2.8l7 3.3v7.8L10 17.2 3 13.9V6.1Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M3 6.2 10 9.6l7-3.4M10 9.6v7.6" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
    lock: (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect x="4" y="8.2" width="12" height="8.5" rx="2" stroke="currentColor" strokeWidth="1.4" />
        <path d="M6.7 8.2V6a3.3 3.3 0 0 1 6.6 0v2.2" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
    check: (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.4" />
        <path d="m6.8 10.1 2.1 2.2 4.5-4.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  }

  return (
    <div className={emphasis ? styles.balanceCardEmphasis : styles.balanceCard}>
      <span className={styles.balanceIcon}>{icons[icon]}</span>
      <div className={styles.balanceContent}>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </div>
  )
}

export default VariantInventoryPage
