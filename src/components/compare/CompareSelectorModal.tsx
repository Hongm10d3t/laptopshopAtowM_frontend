import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '../../hooks/useAppDispatch'
import { useAppSelector } from '../../hooks/useAppSelector'
import { addCompareItem, closeCompareSelector, removeCompareItem, clearCompareItems } from '../../redux/slices/compareSlice'
import { getActiveCategories } from '../../services/catalog/categoryService'
import { getProductBySlug, searchProducts } from '../../services/catalog/productService'
import { formatPriceRange } from '../../utils/currency'
import { getApiErrorMessage } from '../../utils/apiError'
import type { CategoryPublicResponse } from '../../types/catalog/category'
import type { ProductListItemResponse } from '../../types/catalog/product'
import styles from './CompareSelectorModal.module.css'

const MAX_ITEMS = 3
const MIN_ITEMS = 2
const SUGGESTION_SIZE = 8
const SEARCH_DEBOUNCE_MS = 400

const SEARCH_ICON = (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.6" />
    <line x1="13.8" y1="14" x2="18" y2="18.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
)

// Modal chọn sản phẩm so sánh (tham khảo FPT Shop) — thay vì bắt người dùng
// quay lại từng trang chi tiết sản phẩm để bấm "Thêm vào so sánh", modal này
// gợi ý sẵn các sản phẩm cùng danh mục (+ tìm kiếm) ngay tại chỗ. Mount 1 lần
// ở MainLayout, mọi nơi chỉ cần dispatch(openCompareSelector()).
//
// ProductListItemResponse không có variantId (chỉ priceFrom/priceTo gộp từ
// nhiều variant) — khi bấm "Thêm", phải gọi thêm GET /public/products/{slug}
// để lấy variant đầu tiên (ACTIVE) làm variant đại diện, giống cách
// ProductDetailPage đã làm với variant đang chọn.
function CompareSelectorModal() {
  const isOpen = useAppSelector((state) => state.compare.isSelectorOpen)
  const items = useAppSelector((state) => state.compare.items)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const [categories, setCategories] = useState<CategoryPublicResponse[]>([])
  const [manualCategoryId, setManualCategoryId] = useState<number | 'all' | null>(null)
  const [keyword, setKeyword] = useState('')
  const [suggestions, setSuggestions] = useState<ProductListItemResponse[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [addingProductId, setAddingProductId] = useState<number | null>(null)

  useEffect(() => {
    getActiveCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [])

  // Đã có sản phẩm trong danh sách -> khóa cứng gợi ý vào đúng danh mục của
  // sản phẩm đó (Backend chỉ cho so sánh cùng danh mục), không cho chọn danh
  // mục khác nữa — người dùng không cần tự tìm "đúng danh mục", hệ thống lo
  // sẵn. Chỉ khi danh sách rỗng mới cho chọn danh mục tự do để bắt đầu.
  const isLockedToCategory = items.length > 0
  const referenceCategory = categories.find((category) => category.name === items[0]?.categoryName)
  // Đang khóa nhưng chưa xác định được category (categories chưa tải xong) —
  // đợi thay vì tạm hiện gợi ý sai danh mục.
  const isResolvingLockedCategory = isLockedToCategory && !referenceCategory
  const activeCategoryId = isLockedToCategory ? referenceCategory?.id : (manualCategoryId ?? 'all')
  const searchCategoryId = activeCategoryId === 'all' || activeCategoryId === undefined ? undefined : activeCategoryId

  useEffect(() => {
    if (!isOpen || isResolvingLockedCategory) return
    setIsLoadingSuggestions(true)
    const timer = setTimeout(() => {
      searchProducts({ categoryId: searchCategoryId, keyword: keyword.trim() || undefined, size: SUGGESTION_SIZE })
        .then((result) => setSuggestions(result.content))
        .catch(() => setSuggestions([]))
        .finally(() => setIsLoadingSuggestions(false))
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [isOpen, isResolvingLockedCategory, searchCategoryId, keyword])

  if (!isOpen) return null

  async function handleToggleProduct(product: ProductListItemResponse) {
    const existingItem = items.find((item) => item.productId === product.id)
    if (existingItem) {
      dispatch(removeCompareItem(existingItem.variantId))
      return
    }
    if (items.length >= MAX_ITEMS) {
      window.alert(`Chỉ có thể so sánh tối đa ${MAX_ITEMS} sản phẩm. Vui lòng bỏ bớt trước khi thêm mới.`)
      return
    }
    const conflictingItem = items.find((item) => item.categoryName !== product.categoryName)
    if (conflictingItem) {
      window.alert(`Chỉ so sánh được các sản phẩm cùng danh mục "${conflictingItem.categoryName}".`)
      return
    }
    setAddingProductId(product.id)
    try {
      const detail = await getProductBySlug(product.slug)
      const variant = detail.variants[0]
      if (!variant) {
        window.alert('Sản phẩm này hiện không có phiên bản khả dụng để so sánh.')
        return
      }
      dispatch(
        addCompareItem({
          variantId: variant.id,
          productId: detail.id,
          productSlug: detail.slug,
          productName: detail.name,
          variantName: variant.variantName,
          categoryName: detail.categoryName,
          thumbnailUrl: detail.images[0]?.url ?? null,
        }),
      )
    } catch (err) {
      window.alert(getApiErrorMessage(err, 'Không thể thêm sản phẩm này vào so sánh'))
    } finally {
      setAddingProductId(null)
    }
  }

  function handleClose() {
    dispatch(closeCompareSelector())
  }

  function handleCompareNow() {
    dispatch(closeCompareSelector())
    navigate('/compare')
  }

  return (
    <div className={styles.backdrop} onClick={handleClose}>
      <div className={styles.panel} onClick={(event) => event.stopPropagation()}>
        <div className={styles.header}>
          <h2>Chọn sản phẩm so sánh</h2>
          <button type="button" className={styles.closeButton} aria-label="Đóng" onClick={handleClose}>
            ×
          </button>
        </div>

        <div className={styles.searchBar}>
          <span className={styles.searchIcon}>{SEARCH_ICON}</span>
          <input
            type="text"
            placeholder="Nhập sản phẩm bạn muốn so sánh"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>

        {isLockedToCategory ? (
          <p className={styles.lockedCategoryNote}>
            Gợi ý sản phẩm trong danh mục <strong>{items[0].categoryName}</strong>
          </p>
        ) : (
          <div className={styles.categoryPills}>
            <button
              type="button"
              className={activeCategoryId === 'all' ? styles.pillActive : styles.pill}
              onClick={() => setManualCategoryId('all')}
            >
              Tất cả
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                className={activeCategoryId === category.id ? styles.pillActive : styles.pill}
                onClick={() => setManualCategoryId(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}

        <div className={styles.body}>
          <p className={styles.sectionLabel}>
            {keyword.trim() ? 'Kết quả tìm kiếm' : 'Gợi ý sản phẩm cùng phân khúc'}
          </p>

          {isLoadingSuggestions || isResolvingLockedCategory ? (
            <p className={styles.emptyMessage}>Đang tải...</p>
          ) : suggestions.length === 0 ? (
            <p className={styles.emptyMessage}>Không tìm thấy sản phẩm phù hợp.</p>
          ) : (
            <ul className={styles.productList}>
              {suggestions.map((product) => {
                const isAdded = items.some((item) => item.productId === product.id)
                const isAdding = addingProductId === product.id
                return (
                  <li key={product.id} className={styles.productRow}>
                    {product.thumbnailUrl ? (
                      <img src={product.thumbnailUrl} alt={product.name} className={styles.productImage} />
                    ) : (
                      <div className={styles.productImagePlaceholder}>{product.name}</div>
                    )}
                    <div className={styles.productInfo}>
                      <p className={styles.productPrice}>{formatPriceRange(product.priceFrom, product.priceTo)}</p>
                      <p className={styles.productName}>{product.name}</p>
                    </div>
                    <button
                      type="button"
                      className={isAdded ? styles.addedButton : styles.addButton}
                      disabled={isAdding}
                      onClick={() => handleToggleProduct(product)}
                    >
                      {isAdded ? '✓ Đã thêm vào so sánh' : isAdding ? 'Đang thêm...' : '+ Thêm vào so sánh'}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.slots}>
            {Array.from({ length: MAX_ITEMS }, (_, index) => items[index]).map((item, index) =>
              item ? (
                <div key={item.variantId} className={styles.slotFilled}>
                  {item.thumbnailUrl ? (
                    <img src={item.thumbnailUrl} alt={item.productName} />
                  ) : (
                    <span className={styles.slotImagePlaceholder}>{item.productName.charAt(0)}</span>
                  )}
                  <span className={styles.slotName}>{item.productName}</span>
                  <button
                    type="button"
                    className={styles.slotRemove}
                    aria-label={`Bỏ ${item.productName} khỏi so sánh`}
                    onClick={() => dispatch(removeCompareItem(item.variantId))}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div key={`empty-${index}`} className={styles.slotEmpty}>
                  Sản phẩm {index + 1}
                </div>
              ),
            )}
          </div>
          <div className={styles.footerActions}>
            <button type="button" className={styles.clearButton} onClick={() => dispatch(clearCompareItems())}>
              Xóa tất cả
            </button>
            <button
              type="button"
              className={styles.compareNowButton}
              disabled={items.length < MIN_ITEMS}
              onClick={handleCompareNow}
            >
              So sánh ngay ({items.length}/{MAX_ITEMS})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CompareSelectorModal
