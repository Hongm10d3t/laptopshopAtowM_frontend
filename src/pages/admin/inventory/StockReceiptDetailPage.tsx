import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  cancelStockReceipt,
  confirmStockReceipt,
  getStockReceipt,
  replaceStockReceiptItems,
} from '../../../services/inventory/stockReceiptService'
import { getApiErrorMessage } from '../../../utils/apiError'
import { formatDateTime } from '../../../utils/date'
import StockReceiptItemsEditor, { type StockReceiptLine } from './StockReceiptItemsEditor'
import type { StockReceiptDetailResponse, StockReceiptStatus } from '../../../types/inventory/stockReceipt'
import formStyles from '../adminForm.module.css'
import listStyles from '../adminList.module.css'

const STATUS_LABELS: Record<StockReceiptStatus, string> = {
  DRAFT: 'Nháp',
  CONFIRMED: 'Đã xác nhận',
  CANCELLED: 'Đã huỷ',
}

const STATUS_CLASS: Record<StockReceiptStatus, string> = {
  DRAFT: listStyles.statusDraft,
  CONFIRMED: listStyles.statusConfirmed,
  CANCELLED: listStyles.statusCancelled,
}

function StockReceiptDetailPage() {
  const { id } = useParams<{ id: string }>()
  const receiptId = Number(id)
  const navigate = useNavigate()

  const [receipt, setReceipt] = useState<StockReceiptDetailResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditingItems, setIsEditingItems] = useState(false)
  const [editItems, setEditItems] = useState<StockReceiptLine[]>([])
  const [isSavingItems, setIsSavingItems] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  function loadReceipt() {
    setIsLoading(true)
    setError(null)
    getStockReceipt(receiptId)
      .then((data) => {
        setReceipt(data)
        setEditItems(
          data.items.map((item) => ({
            productVariantId: item.productVariantId,
            sku: item.sku,
            productName: item.sku,
            quantity: item.quantity,
          })),
        )
      })
      .catch((err: unknown) => setError(getApiErrorMessage(err)))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    loadReceipt()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receiptId])

  async function handleSaveItems() {
    if (editItems.length === 0) {
      setError('Phiếu nhập phải có ít nhất 1 dòng hàng')
      return
    }
    setIsSavingItems(true)
    setError(null)
    try {
      await replaceStockReceiptItems(receiptId, {
        items: editItems.map((line) => ({ productVariantId: line.productVariantId, quantity: line.quantity })),
      })
      setIsEditingItems(false)
      loadReceipt()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể lưu dòng hàng'))
    } finally {
      setIsSavingItems(false)
    }
  }

  async function handleConfirm() {
    if (!window.confirm('Xác nhận phiếu nhập này? Tồn kho sẽ được cộng ngay sau khi xác nhận.')) return
    setIsConfirming(true)
    setError(null)
    try {
      const updated = await confirmStockReceipt(receiptId)
      setReceipt(updated)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể xác nhận phiếu nhập'))
    } finally {
      setIsConfirming(false)
    }
  }

  async function handleCancel() {
    if (!window.confirm('Huỷ phiếu nhập này?')) return
    setIsCancelling(true)
    setError(null)
    try {
      const updated = await cancelStockReceipt(receiptId)
      setReceipt(updated)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể huỷ phiếu nhập'))
    } finally {
      setIsCancelling(false)
    }
  }

  if (isLoading) {
    return <p>Đang tải...</p>
  }

  if (!receipt) {
    return <p className={listStyles.error}>{error ?? 'Không tìm thấy phiếu nhập'}</p>
  }

  const isDraft = receipt.status === 'DRAFT'

  return (
    <section>
      <p className={formStyles.breadcrumb}>
        <Link to="/admin/inventory/receipts">Phiếu nhập kho</Link>
        <span>/</span>
        <span>{receipt.code}</span>
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, fontSize: '1.3rem' }}>{receipt.code}</h1>
        <span className={STATUS_CLASS[receipt.status]}>{STATUS_LABELS[receipt.status]}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div className={listStyles.mutedCell} style={{ whiteSpace: 'normal' }}>Ghi chú</div>
          <div>{receipt.note || '—'}</div>
        </div>
        <div>
          <div className={listStyles.mutedCell} style={{ whiteSpace: 'normal' }}>Ngày tạo</div>
          <div>{formatDateTime(receipt.createdAt)}</div>
        </div>
        {receipt.confirmedAt && (
          <div>
            <div className={listStyles.mutedCell} style={{ whiteSpace: 'normal' }}>Ngày xác nhận</div>
            <div>{formatDateTime(receipt.confirmedAt)}</div>
          </div>
        )}
        {receipt.cancelledAt && (
          <div>
            <div className={listStyles.mutedCell} style={{ whiteSpace: 'normal' }}>Ngày huỷ</div>
            <div>{formatDateTime(receipt.cancelledAt)}</div>
          </div>
        )}
      </div>

      {isDraft && (
        <div className={formStyles.actionsRow} style={{ marginBottom: '1.5rem' }}>
          <button type="button" className={formStyles.submitButton} disabled={isConfirming} onClick={handleConfirm}>
            {isConfirming ? 'Đang xác nhận...' : 'Xác nhận phiếu nhập'}
          </button>
          <button type="button" className={formStyles.dangerButton} disabled={isCancelling} onClick={handleCancel}>
            {isCancelling ? 'Đang huỷ...' : 'Huỷ phiếu nhập'}
          </button>
        </div>
      )}

      {error && <p className={formStyles.error}>{error}</p>}

      <h2 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        Dòng hàng
        {isDraft && !isEditingItems && (
          <button type="button" className={listStyles.linkButton} onClick={() => setIsEditingItems(true)}>
            Sửa dòng hàng
          </button>
        )}
      </h2>

      {isEditingItems ? (
        <div>
          <StockReceiptItemsEditor items={editItems} onChange={setEditItems} />
          <div className={formStyles.actionsRow} style={{ marginTop: '1rem' }}>
            <button type="button" className={formStyles.submitButton} disabled={isSavingItems} onClick={handleSaveItems}>
              {isSavingItems ? 'Đang lưu...' : 'Lưu dòng hàng'}
            </button>
            <button
              type="button"
              className={formStyles.secondaryButton}
              onClick={() => {
                setIsEditingItems(false)
                loadReceipt()
              }}
            >
              Huỷ
            </button>
          </div>
        </div>
      ) : (
        <div className={listStyles.tableWrapper}>
          <table className={listStyles.table}>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Số lượng</th>
              </tr>
            </thead>
            <tbody>
              {receipt.items.map((item) => (
                <tr key={item.id}>
                  <td className={listStyles.nameCell}>{item.sku}</td>
                  <td>{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: '1.5rem' }}>
        <button type="button" className={formStyles.secondaryButton} onClick={() => navigate('/admin/inventory/receipts')}>
          Quay lại danh sách
        </button>
      </div>
    </section>
  )
}

export default StockReceiptDetailPage
