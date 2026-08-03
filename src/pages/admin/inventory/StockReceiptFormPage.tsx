import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createStockReceipt } from '../../../services/inventory/stockReceiptService'
import { getApiErrorMessage } from '../../../utils/apiError'
import StockReceiptItemsEditor, { type StockReceiptLine } from './StockReceiptItemsEditor'
import formStyles from '../adminForm.module.css'

function StockReceiptFormPage() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [note, setNote] = useState('')
  const [items, setItems] = useState<StockReceiptLine[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (items.length === 0) {
      setError('Phiếu nhập phải có ít nhất 1 dòng hàng')
      return
    }
    setError(null)
    setIsSaving(true)
    try {
      const receipt = await createStockReceipt({
        code: code.trim(),
        note: note.trim() || undefined,
        items: items.map((line) => ({ productVariantId: line.productVariantId, quantity: line.quantity })),
      })
      navigate(`/admin/inventory/receipts/${receipt.id}`)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section>
      <p className={formStyles.breadcrumb}>
        <Link to="/admin/inventory/receipts">Phiếu nhập kho</Link>
        <span>/</span>
        <span>Tạo phiếu nhập</span>
      </p>
      <h1>Tạo phiếu nhập kho</h1>
      <form className={formStyles.form} onSubmit={handleSubmit} style={{ maxWidth: '100%' }}>
        <div className={formStyles.row}>
          <label className={formStyles.field}>
            Mã phiếu nhập
            <input
              type="text"
              value={code}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setCode(event.target.value)}
              maxLength={50}
              placeholder="VD: PN-2026-001"
              required
            />
          </label>
          <label className={formStyles.field}>
            Ghi chú
            <input
              type="text"
              value={note}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setNote(event.target.value)}
              maxLength={500}
            />
          </label>
        </div>

        <StockReceiptItemsEditor items={items} onChange={setItems} />

        {error && <p className={formStyles.error}>{error}</p>}

        <div className={formStyles.actionsRow}>
          <button type="submit" className={formStyles.submitButton} disabled={isSaving}>
            {isSaving ? 'Đang tạo...' : 'Tạo phiếu nhập'}
          </button>
          <button type="button" className={formStyles.secondaryButton} onClick={() => navigate('/admin/inventory/receipts')}>
            Huỷ
          </button>
        </div>
      </form>
    </section>
  )
}

export default StockReceiptFormPage
