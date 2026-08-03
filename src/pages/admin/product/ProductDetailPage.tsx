import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { listCategories } from '../../../services/catalog/adminCategoryService'
import { listBrands } from '../../../services/catalog/adminBrandService'
import { activateProduct, deactivateProduct, getProduct, updateProduct } from '../../../services/catalog/adminProductService'
import { getApiErrorMessage } from '../../../utils/apiError'
import type { CategoryResponse } from '../../../types/catalog/category'
import type { BrandResponse } from '../../../types/catalog/brand'
import type { ProductResponse } from '../../../types/catalog/product'
import ProductVariantsTab from './ProductVariantsTab'
import ProductImagesTab from './ProductImagesTab'
import ProductSpecsTab from './ProductSpecsTab'
import formStyles from '../adminForm.module.css'
import listStyles from '../adminList.module.css'
import styles from './ProductDetailPage.module.css'

interface FormState {
  categoryId: string
  brandId: string
  name: string
  slug: string
  shortDescription: string
  description: string
}

type TabKey = 'variants' | 'images' | 'specs'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'variants', label: 'Phiên bản (SKU)' },
  { key: 'images', label: 'Hình ảnh' },
  { key: 'specs', label: 'Thông số kỹ thuật' },
]

// Trang duy nhất gộp: sửa thông tin chung + 3 tab con (Variant/Ảnh/Thông số)
// — cả 3 đều PHẢI có productId nên không thể tách route riêng như Category/
// Brand (xem ghi chú ở ProductFormPage).
function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const productId = Number(id)
  const navigate = useNavigate()

  const [product, setProduct] = useState<ProductResponse | null>(null)
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [brands, setBrands] = useState<BrandResponse[]>([])
  const [form, setForm] = useState<FormState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('variants')

  function loadProduct() {
    setIsLoading(true)
    setError(null)
    getProduct(productId)
      .then((data) => {
        setProduct(data)
        setForm({
          categoryId: String(data.categoryId),
          brandId: String(data.brandId),
          name: data.name,
          slug: data.slug,
          shortDescription: data.shortDescription ?? '',
          description: data.description ?? '',
        })
      })
      .catch((err: unknown) => setError(getApiErrorMessage(err)))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    loadProduct()
    listCategories({ size: 100 }).then((result) => setCategories(result.content)).catch(() => {})
    listBrands({ size: 100 }).then((result) => setBrands(result.content)).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])

  function handleChange(field: keyof FormState) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((prev) => (prev ? { ...prev, [field]: event.target.value } : prev))
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!form) return
    setError(null)
    setIsSaving(true)
    try {
      const updated = await updateProduct(productId, {
        categoryId: Number(form.categoryId),
        brandId: Number(form.brandId),
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        shortDescription: form.shortDescription.trim() || undefined,
        description: form.description.trim() || undefined,
      })
      setProduct(updated)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleToggleStatus() {
    if (!product) return
    setIsToggling(true)
    setError(null)
    try {
      const updated = product.status === 'ACTIVE' ? await deactivateProduct(productId) : await activateProduct(productId)
      setProduct(updated)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể cập nhật trạng thái sản phẩm'))
    } finally {
      setIsToggling(false)
    }
  }

  if (isLoading || !form) {
    return <p>Đang tải...</p>
  }

  if (!product) {
    return <p className={listStyles.error}>{error ?? 'Không tìm thấy sản phẩm'}</p>
  }

  return (
    <section>
      <p className={styles.breadcrumb}>
        <Link to="/admin/products">Sản phẩm</Link>
        <span>/</span>
        <span>{product.name}</span>
      </p>

      <div className={styles.headerRow}>
        <h1>
          {product.name}
          <span className={product.status === 'ACTIVE' ? listStyles.statusActive : listStyles.statusInactive}>
            {product.status === 'ACTIVE' ? 'Đang hoạt động' : 'Ngừng hoạt động'}
          </span>
        </h1>
        <button
          type="button"
          className={product.status === 'ACTIVE' ? formStyles.dangerButton : formStyles.submitButton}
          disabled={isToggling}
          onClick={handleToggleStatus}
        >
          {isToggling ? 'Đang xử lý...' : product.status === 'ACTIVE' ? 'Ngừng hoạt động' : 'Kích hoạt lại'}
        </button>
      </div>

      <div className={styles.section}>
        <h2>Thông tin chung</h2>
        <form className={formStyles.form} onSubmit={handleSubmit}>
          <div className={formStyles.row}>
            <label className={formStyles.field}>
              Danh mục
              <select value={form.categoryId} onChange={handleChange('categoryId')} required>
                {categories.map((category) => (
                  <option key={category.id} value={category.id} disabled={category.status !== 'ACTIVE' && String(category.id) !== form.categoryId}>
                    {category.name}
                    {category.status !== 'ACTIVE' ? ' (ngừng hoạt động)' : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className={formStyles.field}>
              Thương hiệu
              <select value={form.brandId} onChange={handleChange('brandId')} required>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id} disabled={brand.status !== 'ACTIVE' && String(brand.id) !== form.brandId}>
                    {brand.name}
                    {brand.status !== 'ACTIVE' ? ' (ngừng hoạt động)' : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className={formStyles.field}>
            Tên sản phẩm
            <input type="text" value={form.name} onChange={handleChange('name')} maxLength={255} required />
          </label>
          <label className={formStyles.field}>
            Slug
            <input type="text" value={form.slug} onChange={handleChange('slug')} maxLength={280} />
          </label>
          <label className={formStyles.field}>
            Mô tả ngắn
            <input
              type="text"
              value={form.shortDescription}
              onChange={handleChange('shortDescription')}
              maxLength={500}
            />
          </label>
          <label className={formStyles.field}>
            Mô tả chi tiết
            <textarea value={form.description} onChange={handleChange('description')} rows={6} />
          </label>

          {error && <p className={formStyles.error}>{error}</p>}

          <div className={formStyles.actionsRow}>
            <button type="submit" className={formStyles.submitButton} disabled={isSaving}>
              {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
            <button type="button" className={formStyles.secondaryButton} onClick={() => navigate('/admin/products')}>
              Quay lại danh sách
            </button>
          </div>
        </form>
      </div>

      <div className={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={activeTab === tab.key ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'variants' && <ProductVariantsTab productId={productId} />}
      {activeTab === 'images' && <ProductImagesTab productId={productId} />}
      {activeTab === 'specs' && <ProductSpecsTab productId={productId} categoryId={product.categoryId} />}
    </section>
  )
}

export default ProductDetailPage
