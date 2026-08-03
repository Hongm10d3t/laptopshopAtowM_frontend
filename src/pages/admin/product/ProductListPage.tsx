import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { listCategories } from '../../../services/catalog/adminCategoryService'
import { listBrands } from '../../../services/catalog/adminBrandService'
import { activateProduct, deactivateProduct, listProducts } from '../../../services/catalog/adminProductService'
import { formatDate } from '../../../utils/date'
import { getApiErrorMessage } from '../../../utils/apiError'
import type { CategoryResponse } from '../../../types/catalog/category'
import type { BrandResponse } from '../../../types/catalog/brand'
import type { ProductStatus, ProductSummaryResponse } from '../../../types/catalog/product'
import type { PageResponse } from '../../../types/common/pageResponse'
import styles from '../adminList.module.css'

const PAGE_SIZE = 10

function ProductListPage() {
  const [pageInfo, setPageInfo] = useState<Omit<PageResponse<ProductSummaryResponse>, 'content'> | null>(null)
  const [products, setProducts] = useState<ProductSummaryResponse[]>([])
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [brands, setBrands] = useState<BrandResponse[]>([])
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [brandId, setBrandId] = useState('')
  const [status, setStatus] = useState<'' | ProductStatus>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  useEffect(() => {
    listCategories({ size: 100 }).then((result) => setCategories(result.content)).catch(() => {})
    listBrands({ size: 100 }).then((result) => setBrands(result.content)).catch(() => {})
  }, [])

  function loadProducts() {
    setIsLoading(true)
    setError(null)
    listProducts({
      page: page - 1,
      size: PAGE_SIZE,
      keyword: keyword.trim() || undefined,
      categoryId: categoryId ? Number(categoryId) : undefined,
      brandId: brandId ? Number(brandId) : undefined,
      status: status || undefined,
    })
      .then((result) => {
        setProducts(result.content)
        setPageInfo(result)
      })
      .catch((err: unknown) => setError(getApiErrorMessage(err)))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    loadProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, categoryId, brandId, status])

  function handleSearchSubmit(event: FormEvent) {
    event.preventDefault()
    setPage(1)
    loadProducts()
  }

  async function handleToggleStatus(product: ProductSummaryResponse) {
    setTogglingId(product.id)
    setError(null)
    try {
      if (product.status === 'ACTIVE') {
        await deactivateProduct(product.id)
      } else {
        await activateProduct(product.id)
      }
      loadProducts()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể cập nhật trạng thái sản phẩm'))
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <section>
      <div className={styles.header}>
        <h1>
          Sản phẩm
          {pageInfo && <span className={styles.countBadge}>{pageInfo.totalElements} sản phẩm</span>}
        </h1>
        <Link to="/admin/products/new" className={styles.createButton}>
          + Thêm sản phẩm
        </Link>
      </div>

      <form className={styles.toolbar} onSubmit={handleSearchSubmit}>
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Tìm theo tên sản phẩm..."
          value={keyword}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setKeyword(event.target.value)}
        />
        <select value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setPage(1) }}>
          <option value="">Tất cả danh mục</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select value={brandId} onChange={(event) => { setBrandId(event.target.value); setPage(1) }}>
          <option value="">Tất cả thương hiệu</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(event) => { setStatus(event.target.value as '' | ProductStatus); setPage(1) }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang hoạt động</option>
          <option value="INACTIVE">Ngừng hoạt động</option>
        </select>
        <button type="submit" className={styles.createButton}>
          Tìm kiếm
        </button>
      </form>

      {error && <p className={styles.error}>{error}</p>}

      {isLoading ? (
        <p>Đang tải...</p>
      ) : products.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Không tìm thấy sản phẩm nào.</p>
        </div>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Tên sản phẩm</th>
                  <th>Danh mục</th>
                  <th>Thương hiệu</th>
                  <th>Ngày tạo</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className={styles.nameCell}>{product.name}</td>
                    <td className={styles.mutedCell}>{product.categoryName}</td>
                    <td className={styles.mutedCell}>{product.brandName}</td>
                    <td className={styles.mutedCell}>{formatDate(product.createdAt)}</td>
                    <td>
                      <span className={product.status === 'ACTIVE' ? styles.statusActive : styles.statusInactive}>
                        {product.status === 'ACTIVE' ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        <Link to={`/admin/products/${product.id}`} className={styles.linkButton}>
                          Xem chi tiết
                        </Link>
                        <button
                          type="button"
                          className={product.status === 'ACTIVE' ? styles.dangerLinkButton : styles.linkButton}
                          disabled={togglingId === product.id}
                          onClick={() => handleToggleStatus(product)}
                        >
                          {togglingId === product.id
                            ? 'Đang xử lý...'
                            : product.status === 'ACTIVE'
                              ? 'Ngừng hoạt động'
                              : 'Kích hoạt lại'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pageInfo && pageInfo.totalPages > 1 && (
            <div className={styles.pagination}>
              <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
                ← Trước
              </button>
              <span>
                Trang {page} / {pageInfo.totalPages}
              </span>
              <button type="button" disabled={pageInfo.last} onClick={() => setPage((current) => current + 1)}>
                Sau →
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}

export default ProductListPage
