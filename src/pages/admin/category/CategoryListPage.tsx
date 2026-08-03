import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  activateCategory,
  deactivateCategory,
  listCategories,
} from '../../../services/catalog/adminCategoryService'
import { getApiErrorMessage } from '../../../utils/apiError'
import type { CategoryResponse } from '../../../types/catalog/category'
import type { PageResponse } from '../../../types/common/pageResponse'
import styles from '../adminList.module.css'

const PAGE_SIZE = 10

function CategoryListPage() {
  const [pageInfo, setPageInfo] = useState<Omit<PageResponse<CategoryResponse>, 'content'> | null>(null)
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  function loadCategories() {
    setIsLoading(true)
    setError(null)
    listCategories({ page: page - 1, size: PAGE_SIZE })
      .then((result) => {
        setCategories(result.content)
        setPageInfo(result)
      })
      .catch((err: unknown) => setError(getApiErrorMessage(err)))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    loadCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  async function handleToggleStatus(category: CategoryResponse) {
    setTogglingId(category.id)
    setError(null)
    try {
      if (category.status === 'ACTIVE') {
        await deactivateCategory(category.id)
      } else {
        await activateCategory(category.id)
      }
      loadCategories()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể cập nhật trạng thái danh mục'))
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <section>
      <div className={styles.header}>
        <h1>
          Danh mục
          {pageInfo && <span className={styles.countBadge}>{pageInfo.totalElements} danh mục</span>}
        </h1>
        <Link to="/admin/categories/new" className={styles.createButton}>
          + Thêm danh mục
        </Link>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {isLoading ? (
        <p>Đang tải...</p>
      ) : categories.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Chưa có danh mục nào.</p>
        </div>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Tên danh mục</th>
                  <th>Slug</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td className={styles.nameCell}>{category.name}</td>
                    <td className={styles.mutedCell}>{category.slug}</td>
                    <td>
                      <span className={category.status === 'ACTIVE' ? styles.statusActive : styles.statusInactive}>
                        {category.status === 'ACTIVE' ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        <Link to={`/admin/categories/${category.id}/edit`} className={styles.linkButton}>
                          Sửa
                        </Link>
                        <button
                          type="button"
                          className={category.status === 'ACTIVE' ? styles.dangerLinkButton : styles.linkButton}
                          disabled={togglingId === category.id}
                          onClick={() => handleToggleStatus(category)}
                        >
                          {togglingId === category.id
                            ? 'Đang xử lý...'
                            : category.status === 'ACTIVE'
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

export default CategoryListPage
