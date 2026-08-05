import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import InventorySectionNav from '../../../components/inventory/InventorySectionNav'
import { listBrands } from '../../../services/catalog/adminBrandService'
import { listCategories } from '../../../services/catalog/adminCategoryService'
import { listProducts, listVariants } from '../../../services/catalog/adminProductService'
import { getBalance } from '../../../services/inventory/inventoryService'
import type { BrandResponse } from '../../../types/catalog/brand'
import type { CategoryResponse } from '../../../types/catalog/category'
import type {
  ProductStatus,
  ProductSummaryResponse,
  ProductVariantResponse,
} from '../../../types/catalog/product'
import type { PageResponse } from '../../../types/common/pageResponse'
import type { InventoryBalanceResponse } from '../../../types/inventory/inventory'
import { getApiErrorMessage } from '../../../utils/apiError'
import { formatCurrency } from '../../../utils/currency'
import styles from './InventoryOverviewPage.module.css'

const PAGE_SIZE = 8

interface VariantStockRow {
  variant: ProductVariantResponse
  balance: InventoryBalanceResponse | null
  error: string | null
}

interface ProductInventoryState {
  status: 'loading' | 'success' | 'error'
  rows: VariantStockRow[]
  error: string | null
}

function InventoryOverviewPage() {
  const [products, setProducts] = useState<ProductSummaryResponse[]>([])
  const [pageInfo, setPageInfo] = useState<Omit<PageResponse<ProductSummaryResponse>, 'content'> | null>(null)
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [brands, setBrands] = useState<BrandResponse[]>([])
  const [page, setPage] = useState(1)
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [brandId, setBrandId] = useState('')
  const [status, setStatus] = useState<'' | ProductStatus>('')
  const [expandedProductId, setExpandedProductId] = useState<number | null>(null)
  const [inventoryByProduct, setInventoryByProduct] = useState<Record<number, ProductInventoryState>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    Promise.all([listCategories({ size: 100 }), listBrands({ size: 100 })])
      .then(([categoryResult, brandResult]) => {
        setCategories(categoryResult.content)
        setBrands(brandResult.content)
      })
      .catch(() => {
        // Bộ lọc tham chiếu không chặn việc tra cứu sản phẩm.
      })
  }, [])

  useEffect(() => {
    setIsLoading(true)
    setError(null)
    setExpandedProductId(null)
    listProducts({
      page: page - 1,
      size: PAGE_SIZE,
      keyword: keyword || undefined,
      categoryId: categoryId ? Number(categoryId) : undefined,
      brandId: brandId ? Number(brandId) : undefined,
      status: status || undefined,
    })
      .then((result) => {
        setProducts(result.content)
        setPageInfo(result)
      })
      .catch((err: unknown) => setError(getApiErrorMessage(err, 'Không thể tải danh sách sản phẩm')))
      .finally(() => setIsLoading(false))
  }, [page, keyword, categoryId, brandId, status, reloadKey])

  async function loadProductInventory(productId: number, force = false) {
    if (!force && expandedProductId === productId) {
      setExpandedProductId(null)
      return
    }

    setExpandedProductId(productId)
    const cached = inventoryByProduct[productId]
    if (!force && cached && cached.status !== 'error') {
      return
    }

    setInventoryByProduct((current) => ({
      ...current,
      [productId]: { status: 'loading', rows: [], error: null },
    }))

    try {
      const variants = await listVariants(productId)
      const rows = await Promise.all(
        variants.map(async (variant): Promise<VariantStockRow> => {
          try {
            const balance = await getBalance(variant.id)
            return { variant, balance, error: null }
          } catch (err) {
            return {
              variant,
              balance: null,
              error: getApiErrorMessage(err, 'Không tải được tồn kho'),
            }
          }
        }),
      )

      setInventoryByProduct((current) => ({
        ...current,
        [productId]: { status: 'success', rows, error: null },
      }))
    } catch (err) {
      setInventoryByProduct((current) => ({
        ...current,
        [productId]: {
          status: 'error',
          rows: [],
          error: getApiErrorMessage(err, 'Không thể tải danh sách SKU'),
        },
      }))
    }
  }

  function handleSearch(event: FormEvent) {
    event.preventDefault()
    setPage(1)
    setKeyword(keywordInput.trim())
  }

  function resetFilters() {
    setKeywordInput('')
    setKeyword('')
    setCategoryId('')
    setBrandId('')
    setStatus('')
    setPage(1)
  }

  const hasFilters = Boolean(keyword || categoryId || brandId || status)

  return (
    <section>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Quản lý vận hành</p>
          <h1>Kho hàng</h1>
          <p className={styles.description}>
            Tra cứu số lượng theo từng SKU, xem phần đang giữ cho đơn hàng và thực hiện điều chỉnh có lưu lịch sử.
          </p>
        </div>
        <Link to="/admin/inventory/receipts/new" className={styles.primaryButton}>
          <span aria-hidden="true">＋</span> Tạo phiếu nhập
        </Link>
      </div>

      <InventorySectionNav />

      <div className={styles.workflowGrid}>
        <div className={styles.workflowCard}>
          <span className={styles.workflowNumber}>1</span>
          <div>
            <strong>Tìm sản phẩm</strong>
            <p>Lọc theo tên, danh mục, thương hiệu hoặc trạng thái.</p>
          </div>
        </div>
        <div className={styles.workflowCard}>
          <span className={styles.workflowNumber}>2</span>
          <div>
            <strong>Mở các SKU</strong>
            <p>Số dư chỉ được tải khi mở sản phẩm, tránh request không cần thiết.</p>
          </div>
        </div>
        <div className={styles.workflowCard}>
          <span className={styles.workflowNumber}>3</span>
          <div>
            <strong>Xem hoặc điều chỉnh</strong>
            <p>Đi vào chi tiết SKU để xem lịch sử biến động và cập nhật tồn.</p>
          </div>
        </div>
      </div>

      <div className={styles.stockPanel}>
        <div className={styles.panelHeader}>
          <div>
            <h2>Tồn kho theo sản phẩm</h2>
            <p>Mỗi sản phẩm có thể chứa nhiều cấu hình laptop với SKU và số dư riêng.</p>
          </div>
          {pageInfo && <span className={styles.countBadge}>{pageInfo.totalElements} sản phẩm</span>}
        </div>

        <form className={styles.filters} onSubmit={handleSearch}>
          <label className={styles.searchField}>
            <span className={styles.srOnly}>Tìm sản phẩm</span>
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="8.7" cy="8.7" r="5.2" stroke="currentColor" strokeWidth="1.5" />
              <path d="m12.6 12.6 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={keywordInput}
              onChange={(event) => setKeywordInput(event.target.value)}
              placeholder="Tìm theo tên sản phẩm..."
            />
          </label>
          <select
            value={categoryId}
            onChange={(event) => {
              setCategoryId(event.target.value)
              setPage(1)
            }}
            aria-label="Lọc danh mục"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            value={brandId}
            onChange={(event) => {
              setBrandId(event.target.value)
              setPage(1)
            }}
            aria-label="Lọc thương hiệu"
          >
            <option value="">Tất cả thương hiệu</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as '' | ProductStatus)
              setPage(1)
            }}
            aria-label="Lọc trạng thái sản phẩm"
          >
            <option value="">Mọi trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="INACTIVE">Ngừng hoạt động</option>
          </select>
          <button type="submit" className={styles.searchButton}>Tìm kiếm</button>
          {hasFilters && (
            <button type="button" className={styles.resetButton} onClick={resetFilters}>
              Xóa lọc
            </button>
          )}
        </form>

        {error && (
          <div className={styles.errorBanner} role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => setReloadKey((current) => current + 1)}>
              Thử lại
            </button>
          </div>
        )}

        {isLoading ? (
          <div className={styles.skeletonList} aria-label="Đang tải sản phẩm">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className={styles.skeletonRow} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>□</span>
            <h3>Không tìm thấy sản phẩm</h3>
            <p>Hãy thay đổi từ khóa hoặc bộ lọc để tiếp tục tra cứu tồn kho.</p>
            {hasFilters && <button type="button" onClick={resetFilters}>Xóa toàn bộ bộ lọc</button>}
          </div>
        ) : (
          <div className={styles.productList}>
            {products.map((product) => {
              const inventoryState = inventoryByProduct[product.id]
              const isExpanded = expandedProductId === product.id
              return (
                <article key={product.id} className={isExpanded ? styles.productCardExpanded : styles.productCard}>
                  <div className={styles.productRow}>
                    <button
                      type="button"
                      className={styles.expandButton}
                      aria-expanded={isExpanded}
                      aria-controls={`inventory-product-${product.id}`}
                      onClick={() => loadProductInventory(product.id)}
                    >
                      <span className={styles.chevron} aria-hidden="true">{isExpanded ? '⌄' : '›'}</span>
                      <span className={styles.productIdentity}>
                        <strong>{product.name}</strong>
                        <small>{product.brandName} · {product.categoryName}</small>
                      </span>
                    </button>
                    <span className={product.status === 'ACTIVE' ? styles.activeBadge : styles.inactiveBadge}>
                      {product.status === 'ACTIVE' ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                    </span>
                    <Link to={`/admin/products/${product.id}`} className={styles.secondaryLink}>
                      Chi tiết sản phẩm
                    </Link>
                  </div>

                  {isExpanded && (
                    <div id={`inventory-product-${product.id}`} className={styles.variantArea}>
                      <ProductInventory
                        product={product}
                        state={inventoryState}
                        onRetry={() => loadProductInventory(product.id, true)}
                      />
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}

        {pageInfo && pageInfo.totalPages > 1 && (
          <div className={styles.pagination}>
            <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
              ← Trước
            </button>
            <span>Trang {page} / {pageInfo.totalPages}</span>
            <button type="button" disabled={pageInfo.last} onClick={() => setPage((current) => current + 1)}>
              Sau →
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

interface ProductInventoryProps {
  product: ProductSummaryResponse
  state: ProductInventoryState | undefined
  onRetry: () => void
}

function ProductInventory({ product, state, onRetry }: ProductInventoryProps) {
  const totals = useMemo(() => {
    const balances = state?.rows.flatMap((row) => (row.balance ? [row.balance] : [])) ?? []
    return balances.reduce(
      (sum, balance) => ({
        onHand: sum.onHand + balance.onHandQuantity,
        reserved: sum.reserved + balance.reservedQuantity,
        available: sum.available + balance.availableQuantity,
      }),
      { onHand: 0, reserved: 0, available: 0 },
    )
  }, [state])

  if (!state || state.status === 'loading') {
    return (
      <div className={styles.variantLoading}>
        <span className={styles.spinner} aria-hidden="true" />
        Đang tải các SKU và số dư tồn kho...
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className={styles.inlineError} role="alert">
        <span>{state.error}</span>
        <button type="button" onClick={onRetry}>Tải lại</button>
      </div>
    )
  }

  if (state.rows.length === 0) {
    return (
      <div className={styles.noVariant}>
        <p>Sản phẩm chưa có SKU để theo dõi tồn kho.</p>
        <Link to={`/admin/products/${product.id}`}>Thêm phiên bản sản phẩm</Link>
      </div>
    )
  }

  return (
    <>
      <div className={styles.productTotals}>
        <span><strong>{state.rows.length}</strong> SKU</span>
        <span><strong>{totals.onHand}</strong> tồn thực tế</span>
        <span><strong>{totals.reserved}</strong> đang giữ</span>
        <span className={styles.availableTotal}><strong>{totals.available}</strong> có thể bán</span>
      </div>
      <div className={styles.variantTableWrapper}>
        <table className={styles.variantTable}>
          <thead>
            <tr>
              <th>SKU / Cấu hình</th>
              <th>Giá bán</th>
              <th>Tồn thực tế</th>
              <th>Đang giữ</th>
              <th>Có thể bán</th>
              <th>Trạng thái</th>
              <th><span className={styles.srOnly}>Thao tác</span></th>
            </tr>
          </thead>
          <tbody>
            {state.rows.map(({ variant, balance, error }) => (
              <tr key={variant.id}>
                <td>
                  <strong className={styles.sku}>{variant.sku}</strong>
                  <small>{variant.variantName || 'Cấu hình mặc định'}</small>
                </td>
                <td>{formatCurrency(variant.price)}</td>
                {balance ? (
                  <>
                    <td className={styles.numberCell}>{balance.onHandQuantity}</td>
                    <td className={styles.numberCell}>{balance.reservedQuantity}</td>
                    <td className={styles.availableCell}>{balance.availableQuantity}</td>
                  </>
                ) : (
                  <td colSpan={3} className={styles.balanceError}>{error}</td>
                )}
                <td>
                  <span className={variant.status === 'ACTIVE' ? styles.activeBadge : styles.inactiveBadge}>
                    {variant.status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng bán'}
                  </span>
                </td>
                <td className={styles.actionCell}>
                  <Link
                    to={`/admin/inventory/variants/${variant.id}`}
                    state={{
                      productId: product.id,
                      productName: product.name,
                      variantName: variant.variantName,
                    }}
                  >
                    Xem chi tiết
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default InventoryOverviewPage
