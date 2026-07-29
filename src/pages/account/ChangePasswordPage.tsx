import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { changePassword } from '../../services/auth/authService'
import { getApiErrorMessage } from '../../utils/apiError'
import styles from './accountForm.module.css'

interface FormState {
  currentPassword: string
  newPassword: string
  confirmNewPassword: string
}

const INITIAL_STATE: FormState = { currentPassword: '', newPassword: '', confirmNewPassword: '' }

function ChangePasswordPage() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  function handleChange(field: keyof FormState) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }))
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (form.newPassword.length < 8 || form.newPassword.length > 72) {
      setError('Mật khẩu mới phải từ 8 đến 72 ký tự')
      return
    }
    if (form.newPassword !== form.confirmNewPassword) {
      setError('Mật khẩu mới nhập lại không khớp')
      return
    }
    setError(null)
    setIsSubmitting(true)
    try {
      await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword })
      // Backend revoke refresh token ngay sau khi đổi mật khẩu thành công
      // (ChangePasswordService.java) — changePassword() (authService) đã tự
      // clearCredentials(), ở đây chỉ cần điều hướng + báo cho người dùng
      // biết vì sao bị đăng xuất, tránh cảm giác "đang dùng bỗng dưng văng ra".
      window.alert('Đổi mật khẩu thành công. Vui lòng đăng nhập lại.')
      navigate('/login')
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section>
      <h1>Đổi mật khẩu</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          Mật khẩu hiện tại
          <input type="password" value={form.currentPassword} onChange={handleChange('currentPassword')} required />
        </label>
        <label className={styles.field}>
          Mật khẩu mới
          <input type="password" value={form.newPassword} onChange={handleChange('newPassword')} required />
        </label>
        <label className={styles.field}>
          Nhập lại mật khẩu mới
          <input
            type="password"
            value={form.confirmNewPassword}
            onChange={handleChange('confirmNewPassword')}
            required
          />
        </label>

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
          {isSubmitting ? 'Đang xử lý...' : 'Đổi mật khẩu'}
        </button>
      </form>
    </section>
  )
}

export default ChangePasswordPage
