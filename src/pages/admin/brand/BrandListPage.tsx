import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { activateBrand, deactivateBrand, listBrands } from '../../../services/catalog/adminBrandService'
import { getApiErrorMessage } from '../../../utils/apiError'
import type { BrandResponse } from '../../../types/catalog/brand'
import type { PageResponse } from '../../../types/common/pageResponse'
import styles from '../adminList.module.css'

const PAGE_SIZE = 10

function BrandListPage() {
  const [pageInfo, setPageInfo] = useState<Omit<PageResponse<BrandResponse>, 'content'> | null>(null)
  const [brands, setBrands] = useState<BrandResponse[]>([])
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  function loadBrands() {
    setIsLoading(true)
    setError(null)
    listBrands({ page: page - 1, size: PAGE_SIZE })
      .then((result) => {
        setBrands(result.content)
        setPageInfo(result)
      })
      .catch((err: unknown) => setError(getApiErrorMessage(err)))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    loadBrands()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  async function handleToggleStatus(brand: BrandResponse) {
    setTogglingId(brand.id)
    setError(null)
    try {
      if (brand.status === 'ACTIVE') {
        await deactivateBrand(brand.id)
      } else {
        await activateBrand(brand.id)
      }
      loadBrands()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể cập nhật trạng thái thương hiệu'))
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <section>
      <div className={styles.header}>
        <h1>
          Thương hiệu
          {pageInfo && <span className={styles.countBadge}>{pageInfo.totalElements} thương hiệu</span>}
        </h1>
        <Link to="/admin/brands/new" className={styles.createButton}>
          + Thêm thương hiệu
        </Link>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {isLoading ? (
        <p>Đang tải...</p>
      ) : brands.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Chưa có thương hiệu nào.</p>
        </div>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Logo</th>
                  <th>Tên thương hiệu</th>
                  <th>Slug</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {brands.map((brand) => (
                  <tr key={brand.id}>
                    <td>
                      {brand.logoUrl ? (
                        <img src={brand.logoUrl} alt={brand.name} width={32} height={32} style={{ objectFit: 'contain' }} />
                      ) : (
                        <span className={styles.mutedCell}>—</span>
                      )}
                    </td>
                    <td className={styles.nameCell}>{brand.name}</td>
                    <td className={styles.mutedCell}>{brand.slug}</td>
                    <td>
                      <span className={brand.status === 'ACTIVE' ? styles.statusActive : styles.statusInactive}>
                        {brand.status === 'ACTIVE' ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        <Link to={`/admin/brands/${brand.id}/edit`} className={styles.linkButton}>
                          Sửa
                        </Link>
                        <button
                          type="button"
                          className={brand.status === 'ACTIVE' ? styles.dangerLinkButton : styles.linkButton}
                          disabled={togglingId === brand.id}
                          onClick={() => handleToggleStatus(brand)}
                        >
                          {togglingId === brand.id
                            ? 'Đang xử lý...'
                            : brand.status === 'ACTIVE'
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

export default BrandListPage
