import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { adjustInventory, getBalance, listMovements } from '../../../services/inventory/inventoryService'
import { getApiErrorMessage } from '../../../utils/apiError'
import { formatDateTime } from '../../../utils/date'
import type { InventoryBalanceResponse, InventoryMovementResponse, InventoryMovementType } from '../../../types/inventory/inventory'
import type { PageResponse } from '../../../types/common/pageResponse'
import formStyles from '../adminForm.module.css'
import listStyles from '../adminList.module.css'

const MOVEMENT_TYPE_LABELS: Record<InventoryMovementType, string> = {
  RECEIPT: 'Nhập kho',
  RESERVE: 'Giữ hàng (đặt đơn)',
  RELEASE: 'Nhả giữ hàng',
  SHIPMENT: 'Xuất kho (giao hàng)',
  RETURN: 'Hoàn trả',
  ADJUSTMENT_IN: 'Điều chỉnh tăng',
  ADJUSTMENT_OUT: 'Điều chỉnh giảm',
}

const PAGE_SIZE = 10

// Không có API "liệt kê toàn bộ tồn kho" (xem types/inventory/inventory.ts)
// — trang này LUÔN đi vào từ 1 variant cụ thể (vd link "Tồn kho" ở tab Phiên
// bản của ProductDetailPage), route /admin/inventory/variants/:variantId.
function VariantInventoryPage() {
  const { variantId } = useParams<{ variantId: string }>()
  const variantIdNum = Number(variantId)

  const [balance, setBalance] = useState<InventoryBalanceResponse | null>(null)
  const [movementPage, setMovementPage] = useState<Omit<PageResponse<InventoryMovementResponse>, 'content'> | null>(null)
  const [movements, setMovements] = useState<InventoryMovementResponse[]>([])
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [delta, setDelta] = useState('')
  const [reason, setReason] = useState('')
  const [isAdjusting, setIsAdjusting] = useState(false)
  const [adjustSuccess, setAdjustSuccess] = useState(false)

  function loadData() {
    setIsLoading(true)
    setError(null)
    Promise.all([getBalance(variantIdNum), listMovements(variantIdNum, { page: page - 1, size: PAGE_SIZE })])
      .then(([balanceResult, movementResult]) => {
        setBalance(balanceResult)
        setMovements(movementResult.content)
        setMovementPage(movementResult)
      })
      .catch((err: unknown) => setError(getApiErrorMessage(err)))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantIdNum, page])

  async function handleAdjustSubmit(event: FormEvent) {
    event.preventDefault()
    if (!delta || Number(delta) === 0 || !reason.trim()) {
      setError('Nhập số lượng điều chỉnh khác 0 và lý do')
      return
    }
    setError(null)
    setAdjustSuccess(false)
    setIsAdjusting(true)
    try {
      await adjustInventory(variantIdNum, { delta: Number(delta), reason: reason.trim() })
      setDelta('')
      setReason('')
      setAdjustSuccess(true)
      setPage(1)
      loadData()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể điều chỉnh tồn kho'))
    } finally {
      setIsAdjusting(false)
    }
  }

  if (isLoading && !balance) {
    return <p>Đang tải...</p>
  }

  if (!balance) {
    return <p className={listStyles.error}>{error ?? 'Không tìm thấy tồn kho'}</p>
  }

  return (
    <section>
      <h1 style={{ fontSize: '1.3rem' }}>Tồn kho — SKU {balance.sku}</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ border: '1px solid var(--color-border)', borderRadius: '0.75rem', padding: '1rem' }}>
          <div className={listStyles.mutedCell} style={{ whiteSpace: 'normal' }}>Tồn kho thực tế</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{balance.onHandQuantity}</div>
        </div>
        <div style={{ border: '1px solid var(--color-border)', borderRadius: '0.75rem', padding: '1rem' }}>
          <div className={listStyles.mutedCell} style={{ whiteSpace: 'normal' }}>Đang giữ (đơn chưa xử lý)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{balance.reservedQuantity}</div>
        </div>
        <div style={{ border: '1px solid var(--color-border)', borderRadius: '0.75rem', padding: '1rem' }}>
          <div className={listStyles.mutedCell} style={{ whiteSpace: 'normal' }}>Có thể bán</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-primary)' }}>{balance.availableQuantity}</div>
        </div>
      </div>

      <div style={{ border: '1px solid var(--color-border)', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', margin: '0 0 1rem' }}>Điều chỉnh thủ công</h2>
        <form className={formStyles.form} onSubmit={handleAdjustSubmit} style={{ maxWidth: '100%' }}>
          <div className={formStyles.row}>
            <label className={formStyles.field}>
              Số lượng điều chỉnh <span className={formStyles.hint}>(âm để giảm, dương để tăng)</span>
              <input
                type="number"
                value={delta}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setDelta(event.target.value)}
                placeholder="VD: -2 hoặc 5"
              />
            </label>
            <label className={formStyles.field}>
              Lý do
              <input
                type="text"
                value={reason}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setReason(event.target.value)}
                maxLength={255}
                placeholder="VD: Kiểm kê thiếu hàng"
              />
            </label>
          </div>
          {error && <p className={formStyles.error}>{error}</p>}
          {adjustSuccess && <p className={formStyles.success}>Đã điều chỉnh tồn kho.</p>}
          <div className={formStyles.actionsRow}>
            <button type="submit" className={formStyles.submitButton} disabled={isAdjusting}>
              {isAdjusting ? 'Đang lưu...' : 'Điều chỉnh'}
            </button>
          </div>
        </form>
      </div>

      <h2 style={{ fontSize: '1rem' }}>Lịch sử biến động</h2>
      {movements.length === 0 ? (
        <div className={listStyles.emptyState}>
          <p>Chưa có biến động tồn kho nào.</p>
        </div>
      ) : (
        <>
          <div className={listStyles.tableWrapper}>
            <table className={listStyles.table}>
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Loại</th>
                  <th>Số lượng</th>
                  <th>Tồn sau đó</th>
                  <th>Lý do</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => (
                  <tr key={movement.id}>
                    <td className={listStyles.mutedCell}>{formatDateTime(movement.createdAt)}</td>
                    <td>{MOVEMENT_TYPE_LABELS[movement.type]}</td>
                    <td>{movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity}</td>
                    <td className={listStyles.mutedCell}>{movement.onHandAfter}</td>
                    <td className={listStyles.mutedCell}>{movement.reason || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {movementPage && movementPage.totalPages > 1 && (
            <div className={listStyles.pagination}>
              <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
                ← Trước
              </button>
              <span>
                Trang {page} / {movementPage.totalPages}
              </span>
              <button type="button" disabled={movementPage.last} onClick={() => setPage((current) => current + 1)}>
                Sau →
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}

export default VariantInventoryPage
