import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../../components/product/ProductCard'
import { getActiveBrands } from '../../services/catalog/brandService'
import { getActiveCategories } from '../../services/catalog/categoryService'
import { searchProducts } from '../../services/catalog/productService'
import { getApiErrorMessage } from '../../utils/apiError'
import type { BrandPublicResponse } from '../../types/catalog/brand'
import type { CategoryPublicResponse } from '../../types/catalog/category'
import type { PageResponse } from '../../types/common/pageResponse'
import type { ProductListItemResponse, ProductSortOption } from '../../types/catalog/product'
import styles from './ProductListPage.module.css'

const PAGE_SIZE = 12
const SEARCH_DEBOUNCE_MS = 450

const SORT_OPTIONS: { value: ProductSortOption; label: string }[] = [
  { value: 'NEWEST', label: 'Mới nhất' },
  { value: 'PRICE_ASC', label: 'Giá tăng dần' },
  { value: 'PRICE_DESC', label: 'Giá giảm dần' },
  { value: 'NAME_ASC', label: 'Tên A-Z' },
  { value: 'NAME_DESC', label: 'Tên Z-A' },
]

// Khoảng giá dựng sẵn kiểu các sàn TMĐT thật (thegioididong/fptshop...) thay
// vì bắt người dùng tự gõ số — vẫn giữ ô nhập tùy chỉnh cho trường hợp cần
// khoảng giá khác. min/max undefined nghĩa là không giới hạn 2 đầu.
interface PricePreset {
  label: string
  min?: number
  max?: number
}

const PRICE_PRESETS: PricePreset[] = [
  { label: 'Dưới 15 triệu', max: 15_000_000 },
  { label: '15 - 20 triệu', min: 15_000_000, max: 20_000_000 },
  { label: '20 - 25 triệu', min: 20_000_000, max: 25_000_000 },
  { label: '25 - 35 triệu', min: 25_000_000, max: 35_000_000 },
  { label: 'Trên 35 triệu', min: 35_000_000 },
]

function presetToParams(preset: PricePreset): { minPrice?: string; maxPrice?: string } {
  return {
    minPrice: preset.min !== undefined ? String(preset.min) : undefined,
    maxPrice: preset.max !== undefined ? String(preset.max) : undefined,
  }
}

// Icon trung tính cho mục "Tất cả thương hiệu" (thay vì ký tự "#" khó hiểu) —
// dùng chung style ô tròn với logo thương hiệu thật.
const ALL_BRANDS_ICON = (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <rect x="1" y="1" width="6" height="6" rx="1.2" />
    <rect x="9" y="1" width="6" height="6" rx="1.2" />
    <rect x="1" y="9" width="6" height="6" rx="1.2" />
    <rect x="9" y="9" width="6" height="6" rx="1.2" />
  </svg>
)

interface FilterOptionRowProps {
  active: boolean
  label: string
  icon?: ReactNode
  onClick: () => void
}

// Hàng lọc dạng danh sách dọc dùng chung cho Danh mục/Thương hiệu/Khoảng giá
// — thay cho dạng pill nằm ngang bị xuống dòng lởm chởm khi tên dài/ngắn
// không đều (feedback UI thực tế), đồng thời có dấu tick rõ ràng khi đang chọn.
function FilterOptionRow({ active, label, icon, onClick }: FilterOptionRowProps) {
  return (
    <button type="button" className={active ? styles.filterRowActive : styles.filterRow} onClick={onClick}>
      <span className={styles.filterRowLabel}>
        {icon}
        <span>{label}</span>
      </span>
      {active && (
        <svg className={styles.checkIcon} viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M3 8.5L6.2 11.7L13 4.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  )
}

// Lọc theo category/brand ở đây dùng "slug" trên URL cho dễ đọc/chia sẻ
// (CategoryNav ở Header cũng đã trỏ tới /products?category=<slug>) — resolve
// sang categoryId/brandId thật (PublicProductController chỉ nhận id) sau khi
// tải xong danh sách category/brand.
function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [categories, setCategories] = useState<CategoryPublicResponse[]>([])
  const [brands, setBrands] = useState<BrandPublicResponse[]>([])
  const [isMetaLoading, setIsMetaLoading] = useState(true)

  const [products, setProducts] = useState<ProductListItemResponse[]>([])
  const [pageInfo, setPageInfo] = useState<Omit<PageResponse<ProductListItemResponse>, 'content'> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const categorySlug = searchParams.get('category') ?? ''
  const brandSlug = searchParams.get('brand') ?? ''
  const keyword = searchParams.get('keyword') ?? ''
  const minPrice = searchParams.get('minPrice') ?? ''
  const maxPrice = searchParams.get('maxPrice') ?? ''
  const sort = (searchParams.get('sort') as ProductSortOption | null) ?? 'NEWEST'
  const pageParam = Math.max(Number(searchParams.get('page') ?? '1') || 1, 1)

  const [keywordDraft, setKeywordDraft] = useState(keyword)
  const [minPriceDraft, setMinPriceDraft] = useState(minPrice)
  const [maxPriceDraft, setMaxPriceDraft] = useState(maxPrice)

  const activePresetIndex = PRICE_PRESETS.findIndex((preset) => {
    const params = presetToParams(preset)
    return (params.minPrice ?? '') === minPrice && (params.maxPrice ?? '') === maxPrice
  })
  const isCustomPriceActive = Boolean((minPrice || maxPrice) && activePresetIndex === -1)
  const [isCustomPriceOpen, setIsCustomPriceOpen] = useState(false)

  useEffect(() => {
    if (isCustomPriceActive) setIsCustomPriceOpen(true)
  }, [isCustomPriceActive])

  useEffect(() => {
    setKeywordDraft(keyword)
    setMinPriceDraft(minPrice)
    setMaxPriceDraft(maxPrice)
  }, [keyword, minPrice, maxPrice])

  useEffect(() => {
    Promise.all([getActiveCategories(), getActiveBrands()])
      .then(([categoryList, brandList]) => {
        setCategories(categoryList)
        setBrands(brandList)
      })
      .catch(() => {
        setCategories([])
        setBrands([])
      })
      .finally(() => setIsMetaLoading(false))
  }, [])

  useEffect(() => {
    if (isMetaLoading) return
    const categoryId = categorySlug ? categories.find((category) => category.slug === categorySlug)?.id : undefined
    const brandId = brandSlug ? brands.find((brand) => brand.slug === brandSlug)?.id : undefined

    setIsLoading(true)
    setError(null)
    searchProducts({
      categoryId,
      brandId,
      keyword: keyword || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sort,
      page: pageParam - 1,
      size: PAGE_SIZE,
    })
      .then((result) => {
        setProducts(result.content)
        setPageInfo(result)
      })
      .catch((err: unknown) => setError(getApiErrorMessage(err)))
      .finally(() => setIsLoading(false))
  }, [isMetaLoading, categories, brands, categorySlug, brandSlug, keyword, minPrice, maxPrice, sort, pageParam])

  const updateParams = useCallback(
    (patch: Record<string, string | undefined>, resetPage = true) => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current)
        Object.entries(patch).forEach(([key, value]) => {
          if (value) next.set(key, value)
          else next.delete(key)
        })
        if (resetPage) next.delete('page')
        return next
      })
    },
    [setSearchParams],
  )

  // Tìm theo từ khóa: gõ tới đâu lọc luôn tới đó (debounce 450ms) — không bắt
  // người dùng phải bấm nút mới thấy kết quả, nhưng vẫn giữ nút/Enter để chủ
  // động lọc ngay nếu muốn.
  useEffect(() => {
    const trimmed = keywordDraft.trim()
    if (trimmed === keyword) return
    const timer = setTimeout(() => updateParams({ keyword: trimmed || undefined }), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [keywordDraft, keyword, updateParams])

  function handleSearchSubmit(event: FormEvent) {
    event.preventDefault()
    updateParams({ keyword: keywordDraft.trim() || undefined })
  }

  function handlePresetClick(preset: PricePreset) {
    const params = presetToParams(preset)
    const isActive = (params.minPrice ?? '') === minPrice && (params.maxPrice ?? '') === maxPrice
    updateParams(isActive ? { minPrice: undefined, maxPrice: undefined } : params)
    setIsCustomPriceOpen(false)
  }

  function handleCustomPriceSubmit(event: FormEvent) {
    event.preventDefault()
    updateParams({ minPrice: minPriceDraft || undefined, maxPrice: maxPriceDraft || undefined })
  }

  const hasActiveFilters = Boolean(categorySlug || brandSlug || keyword || minPrice || maxPrice)

  return (
    <div className={styles.page}>
      <form onSubmit={handleSearchSubmit} className={styles.searchBar}>
        <svg className={styles.searchIcon} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.6" />
          <line x1="13.8" y1="14" x2="18" y2="18.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          placeholder="Tìm kiếm theo tên sản phẩm, thương hiệu..."
          value={keywordDraft}
          onChange={(event) => setKeywordDraft(event.target.value)}
        />
        {keywordDraft && (
          <button
            type="button"
            className={styles.clearSearchButton}
            aria-label="Xóa từ khóa"
            onClick={() => {
              setKeywordDraft('')
              updateParams({ keyword: undefined })
            }}
          >
            ×
          </button>
        )}
        <button type="submit" className={styles.searchSubmitButton}>
          Tìm kiếm
        </button>
      </form>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.filterBlock}>
            <div className={styles.filterHeader}>
              <h3>Bộ lọc</h3>
              {hasActiveFilters && (
                <button type="button" className={styles.clearButton} onClick={() => setSearchParams({})}>
                  Xóa tất cả
                </button>
              )}
            </div>
          </div>

          <div className={styles.filterBlock}>
            <h4>Danh mục</h4>
            <ul className={styles.filterList}>
              <li>
                <FilterOptionRow
                  active={categorySlug === ''}
                  label="Tất cả"
                  onClick={() => updateParams({ category: undefined })}
                />
              </li>
              {categories.map((category) => (
                <li key={category.id}>
                  <FilterOptionRow
                    active={categorySlug === category.slug}
                    label={category.name}
                    onClick={() => updateParams({ category: category.slug })}
                  />
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.filterBlock}>
            <h4>Thương hiệu</h4>
            <ul className={styles.filterList}>
              <li>
                <FilterOptionRow
                  active={brandSlug === ''}
                  label="Tất cả thương hiệu"
                  icon={<span className={styles.brandLogoPlaceholder}>{ALL_BRANDS_ICON}</span>}
                  onClick={() => updateParams({ brand: undefined })}
                />
              </li>
              {brands.map((brand) => (
                <li key={brand.id}>
                  <FilterOptionRow
                    active={brandSlug === brand.slug}
                    label={brand.name}
                    icon={
                      brand.logoUrl ? (
                        <img src={brand.logoUrl} alt="" className={styles.brandLogo} />
                      ) : (
                        <span className={styles.brandLogoPlaceholder}>{brand.name.charAt(0)}</span>
                      )
                    }
                    onClick={() => updateParams({ brand: brand.slug })}
                  />
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.filterBlock}>
            <h4>Khoảng giá</h4>
            <ul className={styles.filterList}>
              {PRICE_PRESETS.map((preset, index) => (
                <li key={preset.label}>
                  <FilterOptionRow
                    active={index === activePresetIndex}
                    label={preset.label}
                    onClick={() => handlePresetClick(preset)}
                  />
                </li>
              ))}
            </ul>

            <button
              type="button"
              className={styles.customPriceToggle}
              onClick={() => setIsCustomPriceOpen((open) => !open)}
            >
              {isCustomPriceOpen ? '− Ẩn khoảng giá tùy chỉnh' : '+ Nhập khoảng giá khác'}
            </button>

            {isCustomPriceOpen && (
              <form onSubmit={handleCustomPriceSubmit} className={styles.priceForm}>
                <input
                  type="number"
                  min={0}
                  placeholder="Từ"
                  value={minPriceDraft}
                  onChange={(event) => setMinPriceDraft(event.target.value)}
                />
                <span>-</span>
                <input
                  type="number"
                  min={0}
                  placeholder="Đến"
                  value={maxPriceDraft}
                  onChange={(event) => setMaxPriceDraft(event.target.value)}
                />
                <button type="submit">Áp dụng</button>
              </form>
            )}
          </div>
        </aside>

        <div className={styles.content}>
          <div className={styles.toolbar}>
            <span>{pageInfo ? `${pageInfo.totalElements} sản phẩm` : ''}</span>
            <label className={styles.sortLabel}>
              Sắp xếp:
              <select value={sort} onChange={(event) => updateParams({ sort: event.target.value })}>
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          {isLoading ? (
            <p>Đang tải...</p>
          ) : (
            <>
              <div className={styles.productGrid}>
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              {products.length === 0 && <p>Không tìm thấy sản phẩm phù hợp bộ lọc.</p>}

              {pageInfo && pageInfo.totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    type="button"
                    disabled={pageParam <= 1}
                    onClick={() => updateParams({ page: String(pageParam - 1) }, false)}
                  >
                    ← Trước
                  </button>
                  <span>
                    Trang {pageParam} / {pageInfo.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={pageInfo.last}
                    onClick={() => updateParams({ page: String(pageParam + 1) }, false)}
                  >
                    Sau →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductListPage
