import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createBrand, getBrand, updateBrand } from '../../../services/catalog/adminBrandService'
import { getApiErrorMessage } from '../../../utils/apiError'
import styles from '../adminForm.module.css'

interface FormState {
  name: string
  slug: string
  description: string
  logoUrl: string
}

const INITIAL_STATE: FormState = { name: '', slug: '', description: '', logoUrl: '' }

// Dùng chung cho tạo mới (/admin/brands/new) và sửa (/admin/brands/:id/edit)
// — cùng khuôn CategoryFormPage.
function BrandFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState<FormState>(INITIAL_STATE)
  const [isLoading, setIsLoading] = useState(isEditing)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      return
    }
    getBrand(Number(id))
      .then((data) =>
        setForm({
          name: data.name,
          slug: data.slug,
          description: data.description ?? '',
          logoUrl: data.logoUrl ?? '',
        }),
      )
      .catch((err: unknown) => setError(getApiErrorMessage(err)))
      .finally(() => setIsLoading(false))
  }, [id])

  function handleChange(field: keyof FormState) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }))
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSaving(true)
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      description: form.description.trim() || undefined,
      logoUrl: form.logoUrl.trim() || undefined,
    }
    try {
      if (id) {
        await updateBrand(Number(id), payload)
      } else {
        await createBrand(payload)
      }
      navigate('/admin/brands')
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <p>Đang tải...</p>
  }

  return (
    <section>
      <p className={styles.breadcrumb}>
        <Link to="/admin/brands">Thương hiệu</Link>
        <span>/</span>
        <span>{isEditing ? 'Sửa thương hiệu' : 'Thêm thương hiệu'}</span>
      </p>
      <h1>{isEditing ? 'Sửa thương hiệu' : 'Thêm thương hiệu mới'}</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          Tên thương hiệu
          <input type="text" value={form.name} onChange={handleChange('name')} maxLength={150} required />
        </label>
        <label className={styles.field}>
          Slug <span className={styles.hint}>(bỏ trống để tự sinh từ tên)</span>
          <input type="text" value={form.slug} onChange={handleChange('slug')} maxLength={160} />
        </label>
        <label className={styles.field}>
          Logo URL
          <input type="text" value={form.logoUrl} onChange={handleChange('logoUrl')} maxLength={500} placeholder="https://..." />
        </label>
        <label className={styles.field}>
          Mô tả
          <textarea value={form.description} onChange={handleChange('description')} maxLength={1000} />
        </label>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actionsRow}>
          <button type="submit" className={styles.submitButton} disabled={isSaving}>
            {isSaving ? 'Đang lưu...' : 'Lưu'}
          </button>
          <button type="button" className={styles.secondaryButton} onClick={() => navigate('/admin/brands')}>
            Huỷ
          </button>
        </div>
      </form>
    </section>
  )
}

export default BrandFormPage
