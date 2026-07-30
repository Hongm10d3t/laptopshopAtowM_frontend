import { Fragment, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppDispatch } from '../../hooks/useAppDispatch'
import { useAppSelector } from '../../hooks/useAppSelector'
import { removeCompareItem, clearCompareItems, openCompareSelector } from '../../redux/slices/compareSlice'
import { compareProducts } from '../../services/catalog/productComparisonService'
import { formatCurrency } from '../../utils/currency'
import { getApiErrorMessage } from '../../utils/apiError'
import type { ComparisonResult, ComparisonSpecRow } from '../../types/catalog/comparison'
import styles from './ComparePage.module.css'

const MIN_COMPARE_ITEMS = 2
const MAX_COMPARE_ITEMS = 3

function groupSpecRows(rows: ComparisonSpecRow[]): [string, ComparisonSpecRow[]][] {
  const groups = new Map<string, ComparisonSpecRow[]>()
  for (const row of rows) {
    const existing = groups.get(row.groupLabel)
    if (existing) existing.push(row)
    else groups.set(row.groupLabel, [row])
  }
  return Array.from(groups.entries())
}

// So sánh sản phẩm: đọc danh sách variant đang chờ so sánh từ compareSlice
// (thêm ở ProductDetailPage), gọi GET /public/products/compare thật. Backend
// tự validate số lượng (2-3) và cùng danh mục — lỗi hiển thị nguyên văn từ
// Backend, không tự đoán/nhân bản rule.
function ComparePage() {
  const items = useAppSelector((state) => state.compare.items)
  const dispatch = useAppDispatch()

  const [result, setResult] = useState<ComparisonResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const variantIds = items.map((item) => item.variantId)
  const variantIdsKey = variantIds.join(',')
  const slugByProductId = new Map(items.map((item) => [item.productId, item.productSlug]))

  useEffect(() => {
    if (variantIds.length < MIN_COMPARE_ITEMS) {
      setResult(null)
      return
    }
    setIsLoading(true)
    setError(null)
    compareProducts(variantIds)
      .then(setResult)
      .catch((err: unknown) => setError(getApiErrorMessage(err, 'Không thể so sánh các sản phẩm đã chọn')))
      .finally(() => setIsLoading(false))
    // variantIds đổi reference mỗi render (derive từ items qua .map()) — dùng
    // variantIdsKey (chuỗi ổn định) làm dependency thay vì mảng để effect chỉ
    // chạy lại khi tập hợp variantId thật sự đổi, không phải mỗi lần render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantIdsKey])

  if (items.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>Chưa có sản phẩm nào để so sánh.</p>
        <p className={styles.emptyHint}>
          Chọn sản phẩm để bắt đầu so sánh (tối đa {MAX_COMPARE_ITEMS} sản phẩm cùng danh mục).
        </p>
        <button type="button" className={styles.browseLink} onClick={() => dispatch(openCompareSelector())}>
          Chọn sản phẩm so sánh →
        </button>
      </div>
    )
  }

  if (items.length < MIN_COMPARE_ITEMS) {
    return (
      <div className={styles.emptyState}>
        <p>Cần chọn ít nhất {MIN_COMPARE_ITEMS} sản phẩm để so sánh.</p>
        <p className={styles.emptyHint}>Đang có {items.length} sản phẩm — chọn thêm ít nhất 1 sản phẩm cùng danh mục.</p>
        <button type="button" className={styles.browseLink} onClick={() => dispatch(openCompareSelector())}>
          Thêm sản phẩm →
        </button>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>So sánh sản phẩm</h1>
        <div className={styles.headerActions}>
          {items.length < MAX_COMPARE_ITEMS && (
            <button type="button" className={styles.addMoreButton} onClick={() => dispatch(openCompareSelector())}>
              + Thêm sản phẩm
            </button>
          )}
          <button type="button" className={styles.clearButton} onClick={() => dispatch(clearCompareItems())}>
            Xóa tất cả
          </button>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {isLoading && <p>Đang tải...</p>}

      {result && (
        <div className={styles.tableWrapper}>
          <div className={styles.table} style={{ gridTemplateColumns: `200px repeat(${result.items.length}, 1fr)` }}>
            <div className={styles.cornerCell} />
            {result.items.map((item) => (
              <div key={item.variantId} className={styles.itemHeader}>
                <button
                  type="button"
                  className={styles.removeButton}
                  aria-label={`Bỏ ${item.productName} khỏi so sánh`}
                  onClick={() => dispatch(removeCompareItem(item.variantId))}
                >
                  ×
                </button>
                {item.thumbnailUrl ? (
                  <img src={item.thumbnailUrl} alt={item.productName} className={styles.itemImage} />
                ) : (
                  <div className={styles.itemImagePlaceholder}>{item.productName}</div>
                )}
                {slugByProductId.get(item.productId) ? (
                  <Link to={`/products/${slugByProductId.get(item.productId)}`} className={styles.itemName}>
                    {item.productName}
                  </Link>
                ) : (
                  <span className={styles.itemName}>{item.productName}</span>
                )}
                <p className={styles.itemVariant}>{item.variantName}</p>
                <p className={styles.itemPrice}>{formatCurrency(item.price)}</p>
              </div>
            ))}

            {groupSpecRows(result.specifications).map(([groupLabel, rows]) => (
              <Fragment key={groupLabel}>
                <div className={styles.groupLabel}>{groupLabel}</div>
                {rows.map((row) => (
                  <Fragment key={row.code}>
                    <div className={styles.specLabel}>
                      {row.label}
                      {row.unit ? ` (${row.unit})` : ''}
                    </div>
                    {result.items.map((item) => (
                      <div key={`${row.code}-${item.variantId}`} className={styles.specValue}>
                        {row.values[String(item.variantId)] ?? 'N/A'}
                      </div>
                    ))}
                  </Fragment>
                ))}
              </Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ComparePage
