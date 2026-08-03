import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '../../hooks/useAppDispatch'
import { useAppSelector } from '../../hooks/useAppSelector'
import { addCompareItem, clearCompareItems, closeCompareSelector, removeCompareItem } from '../../redux/slices/compareSlice'
import { getActiveCategories } from '../../services/catalog/categoryService'
import { getProductBySlug, searchProducts } from '../../services/catalog/productService'
import type { CategoryPublicResponse } from '../../types/catalog/category'
import type { ProductDetailResponse, ProductListItemResponse, ProductVariantResponse } from '../../types/catalog/product'
import { getApiErrorMessage } from '../../utils/apiError'
import { formatCurrency, formatPriceRange } from '../../utils/currency'
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

function getVariantLabel(variant: ProductVariantResponse) {
  return variant.variantName?.trim() || variant.sku
}

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
  const [loadingProductId, setLoadingProductId] = useState<number | null>(null)
  const [detailsByProductId, setDetailsByProductId] = useState<Record<number, ProductDetailResponse>>({})
  const [expandedProductId, setExpandedProductId] = useState<number | null>(null)
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null)

  useEffect(() => {
    getActiveCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [])

  const isLockedToCategory = items.length > 0
  const referenceCategory = categories.find((category) => category.name === items[0]?.categoryName)
  const isResolvingLockedCategory = isLockedToCategory && !referenceCategory
  const activeCategoryId = isLockedToCategory ? referenceCategory?.id : (manualCategoryId ?? 'all')
  const searchCategoryId = activeCategoryId === 'all' || activeCategoryId === undefined ? undefined : activeCategoryId

  useEffect(() => {
    if (!isOpen || isResolvingLockedCategory) return

    setIsLoadingSuggestions(true)
    const timer = window.setTimeout(() => {
      searchProducts({
        categoryId: searchCategoryId,
        keyword: keyword.trim() || undefined,
        size: SUGGESTION_SIZE,
      })
        .then((result) => setSuggestions(result.content))
        .catch(() => setSuggestions([]))
        .finally(() => setIsLoadingSuggestions(false))
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [isOpen, isResolvingLockedCategory, searchCategoryId, keyword])

  if (!isOpen) return null

  function validateBeforeAdd(product: ProductListItemResponse) {
    if (items.length >= MAX_ITEMS) {
      window.alert(`Chỉ có thể so sánh tối đa ${MAX_ITEMS} sản phẩm. Vui lòng bỏ bớt trước khi thêm mới.`)
      return false
    }

    const conflictingItem = items.find((item) => item.categoryName !== product.categoryName)
    if (conflictingItem) {
      window.alert(`Chỉ so sánh được các sản phẩm cùng danh mục "${conflictingItem.categoryName}".`)
      return false
    }

    return true
  }

  function addVariant(product: ProductListItemResponse, detail: ProductDetailResponse, variantId: number) {
    const variant = detail.variants.find((item) => item.id === variantId)
    if (!variant) {
      window.alert('Phiên bản đã chọn không còn khả dụng.')
      return
    }

    dispatch(
      addCompareItem({
        variantId: variant.id,
        productId: detail.id,
        productSlug: detail.slug,
        productName: detail.name,
        variantName: getVariantLabel(variant),
        categoryName: detail.categoryName,
        thumbnailUrl: detail.images[0]?.url ?? product.thumbnailUrl,
      }),
    )
    setExpandedProductId(null)
    setSelectedVariantId(null)
  }

  async function handleToggleProduct(product: ProductListItemResponse) {
    const existingItem = items.find((item) => item.productId === product.id)
    if (existingItem) {
      dispatch(removeCompareItem(existingItem.variantId))
      return
    }

    if (!validateBeforeAdd(product)) return

    const cachedDetail = detailsByProductId[product.id]
    if (cachedDetail) {
      if (cachedDetail.variants.length === 1) {
        addVariant(product, cachedDetail, cachedDetail.variants[0].id)
      } else {
        setExpandedProductId(product.id)
        setSelectedVariantId(cachedDetail.variants[0]?.id ?? null)
      }
      return
    }

    setLoadingProductId(product.id)
    try {
      const detail = await getProductBySlug(product.slug)
      setDetailsByProductId((current) => ({ ...current, [product.id]: detail }))

      if (detail.variants.length === 0) {
        window.alert('Sản phẩm này hiện không có phiên bản khả dụng để so sánh.')
        return
      }

      if (detail.variants.length === 1) {
        addVariant(product, detail, detail.variants[0].id)
        return
      }

      setExpandedProductId(product.id)
      setSelectedVariantId(detail.variants[0].id)
    } catch (err) {
      window.alert(getApiErrorMessage(err, 'Không thể tải cấu hình của sản phẩm này'))
    } finally {
      setLoadingProductId(null)
    }
  }

  function handleConfirmVariant(product: ProductListItemResponse) {
    const detail = detailsByProductId[product.id]
    if (!detail || selectedVariantId == null) return
    addVariant(product, detail, selectedVariantId)
  }

  function handleClose() {
    setExpandedProductId(null)
    setSelectedVariantId(null)
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
                const isLoading = loadingProductId === product.id
                const detail = detailsByProductId[product.id]
                const isChoosingVariant = expandedProductId === product.id && !isAdded && detail != null

                return (
                  <li key={product.id} className={styles.productCard}>
                    <div className={styles.productRow}>
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
                        disabled={isLoading}
                        onClick={() => handleToggleProduct(product)}
                      >
                        {isAdded
                          ? '✓ Đã thêm vào so sánh'
                          : isLoading
                            ? 'Đang tải cấu hình...'
                            : isChoosingVariant
                              ? 'Đang chọn cấu hình'
                              : '+ Thêm vào so sánh'}
                      </button>
                    </div>

                    {isChoosingVariant && (
                      <div className={styles.variantPicker}>
                        <label className={styles.variantField}>
                          <span>Chọn cấu hình cần so sánh</span>
                          <select
                            value={selectedVariantId ?? ''}
                            onChange={(event) => setSelectedVariantId(Number(event.target.value))}
                          >
                            {detail.variants.map((variant) => (
                              <option key={variant.id} value={variant.id}>
                                {getVariantLabel(variant)} — {formatCurrency(variant.price)}
                              </option>
                            ))}
                          </select>
                        </label>
                        <button
                          type="button"
                          className={styles.confirmVariantButton}
                          disabled={selectedVariantId == null}
                          onClick={() => handleConfirmVariant(product)}
                        >
                          Thêm cấu hình này
                        </button>
                      </div>
                    )}
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
                  <span className={styles.slotName} title={`${item.productName} - ${item.variantName}`}>
                    {item.productName}
                  </span>
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
