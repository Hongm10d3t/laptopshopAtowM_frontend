import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createCategory, getCategory, updateCategory } from '../../../services/catalog/adminCategoryService'
import { getApiErrorMessage } from '../../../utils/apiError'
import styles from '../adminForm.module.css'

interface FormState {
  name: string
  slug: string
  description: string
}

const INITIAL_STATE: FormState = { name: '', slug: '', description: '' }

// Dùng chung cho tạo mới (route /admin/categories/new) và sửa
// (/admin/categories/:id/edit) — cùng khuôn AddressFormPage (Gói 1.5).
function CategoryFormPage() {
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
    getCategory(Number(id))
      .then((data) =>
        setForm({ name: data.name, slug: data.slug, description: data.description ?? '' }),
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
    }
    try {
      if (id) {
        await updateCategory(Number(id), payload)
      } else {
        await createCategory(payload)
      }
      navigate('/admin/categories')
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
        <Link to="/admin/categories">Danh mục</Link>
        <span>/</span>
        <span>{isEditing ? 'Sửa danh mục' : 'Thêm danh mục'}</span>
      </p>
      <h1>{isEditing ? 'Sửa danh mục' : 'Thêm danh mục mới'}</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          Tên danh mục
          <input type="text" value={form.name} onChange={handleChange('name')} maxLength={150} required />
        </label>
        <label className={styles.field}>
          Slug <span className={styles.hint}>(bỏ trống để tự sinh từ tên)</span>
          <input type="text" value={form.slug} onChange={handleChange('slug')} maxLength={160} />
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
          <button type="button" className={styles.secondaryButton} onClick={() => navigate('/admin/categories')}>
            Huỷ
          </button>
        </div>
      </form>
    </section>
  )
}

export default CategoryFormPage
