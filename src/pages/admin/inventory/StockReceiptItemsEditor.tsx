import { useState, type ChangeEvent, type FormEvent } from 'react'
import { listProducts, listVariants } from '../../../services/catalog/adminProductService'
import { getApiErrorMessage } from '../../../utils/apiError'
import type { ProductSummaryResponse, ProductVariantResponse } from '../../../types/catalog/product'
import listStyles from '../adminList.module.css'
import tabStyles from '../product/productTabs.module.css'

export interface StockReceiptLine {
  productVariantId: number
  sku: string
  productName: string
  quantity: number
}

interface StockReceiptItemsEditorProps {
  items: StockReceiptLine[]
  onChange: (items: StockReceiptLine[]) => void
}

// Dùng chung cho tạo mới (StockReceiptFormPage) và sửa dòng hàng lúc còn
// DRAFT (StockReceiptDetailPage) — Backend không có API "tìm variant theo từ
// khoá" riêng nên phải đi qua 2 bước: tìm Product (listProducts) rồi chọn
// Variant của product đó (listVariants), đúng thiết kế AdminProductController.
function StockReceiptItemsEditor({ items, onChange }: StockReceiptItemsEditorProps) {
  const [keyword, setKeyword] = useState('')
  const [products, setProducts] = useState<ProductSummaryResponse[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductSummaryResponse | null>(null)
  const [variants, setVariants] = useState<ProductVariantResponse[]>([])
  const [selectedVariantId, setSelectedVariantId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSearch(event: FormEvent) {
    event.preventDefault()
    if (!keyword.trim()) return
    setIsSearching(true)
    setError(null)
    try {
      const result = await listProducts({ keyword: keyword.trim(), status: 'ACTIVE', size: 10 })
      setProducts(result.content)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tìm sản phẩm'))
    } finally {
      setIsSearching(false)
    }
  }

  async function handleSelectProduct(product: ProductSummaryResponse) {
    setSelectedProduct(product)
    setSelectedVariantId('')
    setError(null)
    try {
      const result = await listVariants(product.id)
      setVariants(result.filter((variant) => variant.status === 'ACTIVE'))
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tải phiên bản sản phẩm'))
    }
  }

  function handleAddLine() {
    if (!selectedVariantId || !quantity || Number(quantity) <= 0) {
      setError('Chọn phiên bản và nhập số lượng hợp lệ')
      return
    }
    const variant = variants.find((item) => item.id === Number(selectedVariantId))
    if (!variant || !selectedProduct) return

    const existingIndex = items.findIndex((line) => line.productVariantId === variant.id)
    if (existingIndex >= 0) {
      const updated = [...items]
      updated[existingIndex] = { ...updated[existingIndex], quantity: updated[existingIndex].quantity + Number(quantity) }
      onChange(updated)
    } else {
      onChange([
        ...items,
        {
          productVariantId: variant.id,
          sku: variant.sku,
          productName: `${selectedProduct.name}${variant.variantName ? ` - ${variant.variantName}` : ''}`,
          quantity: Number(quantity),
        },
      ])
    }
    setQuantity('')
    setSelectedVariantId('')
    setError(null)
  }

  function handleRemoveLine(variantId: number) {
    onChange(items.filter((line) => line.productVariantId !== variantId))
  }

  return (
    <div>
      <form className={tabStyles.addForm} onSubmit={handleSearch} style={{ marginBottom: '0.75rem' }}>
        <label style={{ gridColumn: '1 / -1' }}>
          Tìm sản phẩm
          <input
            type="text"
            value={keyword}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setKeyword(event.target.value)}
            placeholder="Nhập tên sản phẩm..."
          />
        </label>
        <div className={tabStyles.addFormActions}>
          <button type="submit" className={tabStyles.addButton} disabled={isSearching}>
            {isSearching ? 'Đang tìm...' : 'Tìm sản phẩm'}
          </button>
        </div>
      </form>

      {products.length > 0 && (
        <div className={listStyles.tableWrapper} style={{ marginBottom: '0.75rem' }}>
          <table className={listStyles.table}>
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Danh mục</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td className={listStyles.nameCell}>{product.name}</td>
                  <td className={listStyles.mutedCell}>{product.categoryName}</td>
                  <td>
                    <button type="button" className={listStyles.linkButton} onClick={() => handleSelectProduct(product)}>
                      Chọn
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedProduct && (
        <div className={tabStyles.addForm}>
          <label>
            Sản phẩm đã chọn
            <input type="text" value={selectedProduct.name} disabled />
          </label>
          <label>
            Phiên bản
            <select value={selectedVariantId} onChange={(event) => setSelectedVariantId(event.target.value)}>
              <option value="">-- Chọn phiên bản --</option>
              {variants.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.sku} {variant.variantName ? `- ${variant.variantName}` : ''}
                </option>
              ))}
            </select>
          </label>
          <label>
            Số lượng
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setQuantity(event.target.value)}
            />
          </label>
          <div className={tabStyles.addFormActions}>
            <button type="button" className={tabStyles.addButton} onClick={handleAddLine}>
              + Thêm dòng
            </button>
          </div>
        </div>
      )}

      {error && <p className={listStyles.error}>{error}</p>}

      {items.length > 0 && (
        <div className={listStyles.tableWrapper} style={{ marginTop: '1rem' }}>
          <table className={listStyles.table}>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Sản phẩm</th>
                <th>Số lượng</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((line) => (
                <tr key={line.productVariantId}>
                  <td className={listStyles.mutedCell}>{line.sku}</td>
                  <td className={listStyles.nameCell}>{line.productName}</td>
                  <td>{line.quantity}</td>
                  <td>
                    <button
                      type="button"
                      className={listStyles.dangerLinkButton}
                      onClick={() => handleRemoveLine(line.productVariantId)}
                    >
                      Xoá
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default StockReceiptItemsEditor
