import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  activateVariant,
  addVariant,
  deactivateVariant,
  listVariants,
  updateVariant,
} from '../../../services/catalog/adminProductService'
import { formatCurrency } from '../../../utils/currency'
import { getApiErrorMessage } from '../../../utils/apiError'
import type { ProductVariantResponse } from '../../../types/catalog/product'
import listStyles from '../adminList.module.css'
import tabStyles from './productTabs.module.css'

interface AddFormState {
  sku: string
  variantName: string
  price: string
  ramGb: string
  storageGb: string
  storageType: string
  color: string
}

const EMPTY_ADD_FORM: AddFormState = {
  sku: '',
  variantName: '',
  price: '',
  ramGb: '',
  storageGb: '',
  storageType: '',
  color: '',
}

interface EditFormState {
  variantName: string
  price: string
  ramGb: string
  storageGb: string
  storageType: string
  color: string
}

interface ProductVariantsTabProps {
  productId: number
}

function ProductVariantsTab({ productId }: ProductVariantsTabProps) {
  const [variants, setVariants] = useState<ProductVariantResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isAdding, setIsAdding] = useState(false)
  const [addForm, setAddForm] = useState<AddFormState>(EMPTY_ADD_FORM)
  const [isSavingAdd, setIsSavingAdd] = useState(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<EditFormState | null>(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  function loadVariants() {
    setIsLoading(true)
    setError(null)
    listVariants(productId)
      .then(setVariants)
      .catch((err: unknown) => setError(getApiErrorMessage(err)))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    loadVariants()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])

  function handleAddChange(field: keyof AddFormState) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      setAddForm((prev) => ({ ...prev, [field]: event.target.value }))
    }
  }

  async function handleAddSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSavingAdd(true)
    try {
      await addVariant(productId, {
        sku: addForm.sku.trim(),
        variantName: addForm.variantName.trim() || undefined,
        price: Number(addForm.price),
        ramGb: addForm.ramGb ? Number(addForm.ramGb) : undefined,
        storageGb: addForm.storageGb ? Number(addForm.storageGb) : undefined,
        storageType: addForm.storageType.trim() || undefined,
        color: addForm.color.trim() || undefined,
      })
      setAddForm(EMPTY_ADD_FORM)
      setIsAdding(false)
      loadVariants()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể thêm phiên bản'))
    } finally {
      setIsSavingAdd(false)
    }
  }

  function startEdit(variant: ProductVariantResponse) {
    setEditingId(variant.id)
    setEditForm({
      variantName: variant.variantName ?? '',
      price: String(variant.price),
      ramGb: variant.ramGb != null ? String(variant.ramGb) : '',
      storageGb: variant.storageGb != null ? String(variant.storageGb) : '',
      storageType: variant.storageType ?? '',
      color: variant.color ?? '',
    })
  }

  function handleEditChange(field: keyof EditFormState) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      setEditForm((prev) => (prev ? { ...prev, [field]: event.target.value } : prev))
    }
  }

  async function handleEditSubmit(variantId: number) {
    if (!editForm) return
    setError(null)
    setIsSavingEdit(true)
    try {
      await updateVariant(productId, variantId, {
        variantName: editForm.variantName.trim() || undefined,
        price: Number(editForm.price),
        ramGb: editForm.ramGb ? Number(editForm.ramGb) : undefined,
        storageGb: editForm.storageGb ? Number(editForm.storageGb) : undefined,
        storageType: editForm.storageType.trim() || undefined,
        color: editForm.color.trim() || undefined,
      })
      setEditingId(null)
      setEditForm(null)
      loadVariants()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể lưu phiên bản'))
    } finally {
      setIsSavingEdit(false)
    }
  }

  async function handleToggleStatus(variant: ProductVariantResponse) {
    setTogglingId(variant.id)
    setError(null)
    try {
      if (variant.status === 'ACTIVE') {
        await deactivateVariant(productId, variant.id)
      } else {
        await activateVariant(productId, variant.id)
      }
      loadVariants()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể cập nhật trạng thái phiên bản'))
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div>
      <div className={tabStyles.tabHeader}>
        <h3>{variants.length} phiên bản</h3>
        <button type="button" className={tabStyles.addButton} onClick={() => setIsAdding((prev) => !prev)}>
          {isAdding ? 'Đóng' : '+ Thêm phiên bản'}
        </button>
      </div>

      {isAdding && (
        <form className={tabStyles.addForm} onSubmit={handleAddSubmit}>
          <label>
            SKU
            <input type="text" value={addForm.sku} onChange={handleAddChange('sku')} maxLength={100} required />
          </label>
          <label>
            Tên phiên bản
            <input type="text" value={addForm.variantName} onChange={handleAddChange('variantName')} maxLength={255} />
          </label>
          <label>
            Giá (đ)
            <input type="number" min={1} value={addForm.price} onChange={handleAddChange('price')} required />
          </label>
          <label>
            RAM (GB)
            <input type="number" min={1} value={addForm.ramGb} onChange={handleAddChange('ramGb')} />
          </label>
          <label>
            Lưu trữ (GB)
            <input type="number" min={1} value={addForm.storageGb} onChange={handleAddChange('storageGb')} />
          </label>
          <label>
            Loại lưu trữ
            <input type="text" value={addForm.storageType} onChange={handleAddChange('storageType')} maxLength={20} placeholder="SSD/HDD" />
          </label>
          <label>
            Màu sắc
            <input type="text" value={addForm.color} onChange={handleAddChange('color')} maxLength={50} />
          </label>
          <div className={tabStyles.addFormActions}>
            <button type="submit" className={tabStyles.addButton} disabled={isSavingAdd}>
              {isSavingAdd ? 'Đang lưu...' : 'Lưu phiên bản'}
            </button>
          </div>
        </form>
      )}

      {error && <p className={listStyles.error}>{error}</p>}

      {isLoading ? (
        <p>Đang tải...</p>
      ) : variants.length === 0 ? (
        <div className={listStyles.emptyState}>
          <p>Sản phẩm chưa có phiên bản nào.</p>
        </div>
      ) : (
        <div className={listStyles.tableWrapper}>
          <table className={listStyles.table}>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Tên phiên bản</th>
                <th>Giá</th>
                <th>Cấu hình</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((variant) =>
                editingId === variant.id && editForm ? (
                  <tr key={variant.id}>
                    <td className={listStyles.mutedCell}>{variant.sku}</td>
                    <td>
                      <input
                        className={tabStyles.inlineInput}
                        value={editForm.variantName}
                        onChange={handleEditChange('variantName')}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min={1}
                        className={tabStyles.inlineInput}
                        value={editForm.price}
                        onChange={handleEditChange('price')}
                      />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <input
                          type="number"
                          className={tabStyles.inlineInput}
                          placeholder="RAM"
                          value={editForm.ramGb}
                          onChange={handleEditChange('ramGb')}
                        />
                        <input
                          type="number"
                          className={tabStyles.inlineInput}
                          placeholder="SSD"
                          value={editForm.storageGb}
                          onChange={handleEditChange('storageGb')}
                        />
                        <input
                          className={tabStyles.inlineInput}
                          placeholder="Màu"
                          value={editForm.color}
                          onChange={handleEditChange('color')}
                        />
                      </div>
                    </td>
                    <td>
                      <span className={variant.status === 'ACTIVE' ? listStyles.statusActive : listStyles.statusInactive}>
                        {variant.status === 'ACTIVE' ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                      </span>
                    </td>
                    <td>
                      <div className={listStyles.actionsCell}>
                        <button
                          type="button"
                          className={listStyles.linkButton}
                          disabled={isSavingEdit}
                          onClick={() => handleEditSubmit(variant.id)}
                        >
                          {isSavingEdit ? 'Đang lưu...' : 'Lưu'}
                        </button>
                        <button type="button" className={listStyles.linkButton} onClick={() => setEditingId(null)}>
                          Huỷ
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={variant.id}>
                    <td className={listStyles.mutedCell}>{variant.sku}</td>
                    <td className={listStyles.nameCell}>{variant.variantName ?? '—'}</td>
                    <td>{formatCurrency(variant.price)}</td>
                    <td className={listStyles.mutedCell}>
                      {[variant.ramGb && `${variant.ramGb}GB RAM`, variant.storageGb && `${variant.storageGb}GB ${variant.storageType ?? ''}`, variant.color]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </td>
                    <td>
                      <span className={variant.status === 'ACTIVE' ? listStyles.statusActive : listStyles.statusInactive}>
                        {variant.status === 'ACTIVE' ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                      </span>
                    </td>
                    <td>
                      <div className={listStyles.actionsCell}>
                        <button type="button" className={listStyles.linkButton} onClick={() => startEdit(variant)}>
                          Sửa
                        </button>
                        <Link to={`/admin/inventory/variants/${variant.id}`} className={listStyles.linkButton}>
                          Tồn kho
                        </Link>
                        <button
                          type="button"
                          className={variant.status === 'ACTIVE' ? listStyles.dangerLinkButton : listStyles.linkButton}
                          disabled={togglingId === variant.id}
                          onClick={() => handleToggleStatus(variant)}
                        >
                          {togglingId === variant.id
                            ? '...'
                            : variant.status === 'ACTIVE'
                              ? 'Ngừng hoạt động'
                              : 'Kích hoạt'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default ProductVariantsTab
