import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createAddress, getAddress, updateAddress } from '../../services/user/addressService'
import { getApiErrorMessage } from '../../utils/apiError'
import styles from './accountForm.module.css'

interface FormState {
  recipientName: string
  phone: string
  province: string
  district: string
  ward: string
  streetAddress: string
}

const INITIAL_STATE: FormState = {
  recipientName: '',
  phone: '',
  province: '',
  district: '',
  ward: '',
  streetAddress: '',
}

// Dùng chung cho tạo mới (route /account/addresses/new, không có :id) và sửa
// (route /account/addresses/:id/edit) — cùng 1 form, khác mỗi hành vi submit
// (createAddress vs updateAddress), tránh 2 file gần như giống hệt nhau.
function AddressFormPage() {
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
    getAddress(Number(id))
      .then((data) =>
        setForm({
          recipientName: data.recipientName,
          phone: data.phone,
          province: data.province,
          district: data.district,
          ward: data.ward,
          streetAddress: data.streetAddress,
        }),
      )
      .catch((err: unknown) => setError(getApiErrorMessage(err)))
      .finally(() => setIsLoading(false))
  }, [id])

  function handleChange(field: keyof FormState) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }))
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSaving(true)
    try {
      if (id) {
        await updateAddress(Number(id), form)
      } else {
        await createAddress(form)
      }
      navigate('/account/addresses')
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
      <h1>{isEditing ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          Tên người nhận
          <input type="text" value={form.recipientName} onChange={handleChange('recipientName')} required />
        </label>
        <label className={styles.field}>
          Số điện thoại
          <input type="tel" value={form.phone} onChange={handleChange('phone')} required />
        </label>
        <label className={styles.field}>
          Tỉnh/Thành phố
          <input type="text" value={form.province} onChange={handleChange('province')} required />
        </label>
        <label className={styles.field}>
          Quận/Huyện
          <input type="text" value={form.district} onChange={handleChange('district')} required />
        </label>
        <label className={styles.field}>
          Phường/Xã
          <input type="text" value={form.ward} onChange={handleChange('ward')} required />
        </label>
        <label className={styles.field}>
          Địa chỉ chi tiết
          <input type="text" value={form.streetAddress} onChange={handleChange('streetAddress')} required />
        </label>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actionsRow}>
          <button type="submit" className={styles.submitButton} disabled={isSaving}>
            {isSaving ? 'Đang lưu...' : 'Lưu'}
          </button>
          <button type="button" className={styles.secondaryButton} onClick={() => navigate('/account/addresses')}>
            Huỷ
          </button>
        </div>
      </form>
    </section>
  )
}

export default AddressFormPage
