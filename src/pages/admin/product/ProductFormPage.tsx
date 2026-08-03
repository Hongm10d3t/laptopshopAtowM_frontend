import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { listCategories } from '../../../services/catalog/adminCategoryService'
import { listBrands } from '../../../services/catalog/adminBrandService'
import { createProduct } from '../../../services/catalog/adminProductService'
import { getApiErrorMessage } from '../../../utils/apiError'
import type { CategoryResponse } from '../../../types/catalog/category'
import type { BrandResponse } from '../../../types/catalog/brand'
import styles from '../adminForm.module.css'

interface FormState {
  categoryId: string
  brandId: string
  name: string
  slug: string
  shortDescription: string
  description: string
}

const INITIAL_STATE: FormState = {
  categoryId: '',
  brandId: '',
  name: '',
  slug: '',
  shortDescription: '',
  description: '',
}

// Chỉ tạo mới ở đây — Variant/Ảnh/Thông số kỹ thuật (Gói 6.2 phần còn lại)
// đều cần productId đã tồn tại nên chỉ thao tác được ở ProductDetailPage,
// KHÔNG gộp vào 1 form dài như Category/Brand.
function ProductFormPage() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [brands, setBrands] = useState<BrandResponse[]>([])
  const [form, setForm] = useState<FormState>(INITIAL_STATE)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listCategories({ size: 100 }).then((result) => setCategories(result.content)).catch(() => {})
    listBrands({ size: 100 }).then((result) => setBrands(result.content)).catch(() => {})
  }, [])

  function handleChange(field: keyof FormState) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }))
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!form.categoryId || !form.brandId) {
      setError('Vui lòng chọn danh mục và thương hiệu')
      return
    }
    setError(null)
    setIsSaving(true)
    try {
      const product = await createProduct({
        categoryId: Number(form.categoryId),
        brandId: Number(form.brandId),
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        shortDescription: form.shortDescription.trim() || undefined,
        description: form.description.trim() || undefined,
      })
      // Sau khi tạo, sang thẳng trang chi tiết để thêm Phiên bản/Ảnh/Thông số
      // — 3 việc đó bắt buộc phải có productId nên không thể làm ngay ở đây.
      navigate(`/admin/products/${product.id}`)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section>
      <p className={styles.breadcrumb}>
        <Link to="/admin/products">Sản phẩm</Link>
        <span>/</span>
        <span>Thêm sản phẩm</span>
      </p>
      <h1>Thêm sản phẩm mới</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.row}>
          <label className={styles.field}>
            Danh mục
            <select value={form.categoryId} onChange={handleChange('categoryId')} required>
              <option value="">-- Chọn danh mục --</option>
              {categories
                .filter((category) => category.status === 'ACTIVE')
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </select>
          </label>
          <label className={styles.field}>
            Thương hiệu
            <select value={form.brandId} onChange={handleChange('brandId')} required>
              <option value="">-- Chọn thương hiệu --</option>
              {brands
                .filter((brand) => brand.status === 'ACTIVE')
                .map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
            </select>
          </label>
        </div>

        <label className={styles.field}>
          Tên sản phẩm
          <input type="text" value={form.name} onChange={handleChange('name')} maxLength={255} required />
        </label>
        <label className={styles.field}>
          Slug <span className={styles.hint}>(bỏ trống để tự sinh từ tên)</span>
          <input type="text" value={form.slug} onChange={handleChange('slug')} maxLength={280} />
        </label>
        <label className={styles.field}>
          Mô tả ngắn
          <input
            type="text"
            value={form.shortDescription}
            onChange={handleChange('shortDescription')}
            maxLength={500}
          />
        </label>
        <label className={styles.field}>
          Mô tả chi tiết
          <textarea value={form.description} onChange={handleChange('description')} rows={6} />
        </label>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actionsRow}>
          <button type="submit" className={styles.submitButton} disabled={isSaving}>
            {isSaving ? 'Đang tạo...' : 'Tạo sản phẩm'}
          </button>
          <button type="button" className={styles.secondaryButton} onClick={() => navigate('/admin/products')}>
            Huỷ
          </button>
        </div>
      </form>
    </section>
  )
}

export default ProductFormPage
