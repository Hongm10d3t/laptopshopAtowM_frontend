import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { register } from '../../services/auth/authService'
import { getApiErrorMessage } from '../../utils/apiError'
import styles from './RegisterPage.module.css'

interface FormState {
  email: string
  password: string
  confirmPassword: string
  fullName: string
  phone: string
}

const INITIAL_STATE: FormState = {
  email: '',
  password: '',
  confirmPassword: '',
  fullName: '',
  phone: '',
}

// Validate phía client chỉ để phản hồi nhanh (đúng theo constraint thật của
// RegisterRequest: email hợp lệ, password 8-72 ký tự, fullName bắt buộc) —
// Backend vẫn là nơi validate cuối cùng, không tin riêng validate FE.
function validate(form: FormState): string | null {
  if (!form.email.trim() || !form.password || !form.fullName.trim()) {
    return 'Vui lòng nhập đầy đủ các trường bắt buộc'
  }
  if (!/^\S+@\S+\.\S+$/.test(form.email)) {
    return 'Email không đúng định dạng'
  }
  if (form.password.length < 8 || form.password.length > 72) {
    return 'Mật khẩu phải từ 8 đến 72 ký tự'
  }
  if (form.password !== form.confirmPassword) {
    return 'Mật khẩu nhập lại không khớp'
  }
  return null
}

function RegisterPage() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null)

  function handleChange(field: keyof FormState) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }))
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const validationError = validate(form)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    setIsSubmitting(true)
    try {
      const response = await register({
        email: form.email.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || undefined,
      })
      setRegisteredEmail(response.email)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (registeredEmail) {
    return (
      <section className={styles.wrapper}>
        <h1>Đăng ký thành công</h1>
        <p>
          Chúng tôi đã gửi email xác thực tới <strong>{registeredEmail}</strong>. Vui lòng kiểm tra hộp thư (hoặc hộp
          thư Mailtrap nếu đang chạy môi trường demo/dev) và bấm vào link xác thực, hoặc dán token vào{' '}
          <Link to="/verify-email">trang xác thực email</Link>.
        </p>
      </section>
    )
  }

  return (
    <section className={styles.wrapper}>
      <h1>Đăng ký tài khoản</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          Email
          <input type="email" value={form.email} onChange={handleChange('email')} required />
        </label>
        <label className={styles.field}>
          Họ tên
          <input type="text" value={form.fullName} onChange={handleChange('fullName')} required />
        </label>
        <label className={styles.field}>
          Số điện thoại (không bắt buộc)
          <input type="tel" value={form.phone} onChange={handleChange('phone')} />
        </label>
        <label className={styles.field}>
          Mật khẩu
          <input type="password" value={form.password} onChange={handleChange('password')} required />
        </label>
        <label className={styles.field}>
          Nhập lại mật khẩu
          <input type="password" value={form.confirmPassword} onChange={handleChange('confirmPassword')} required />
        </label>

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
          {isSubmitting ? 'Đang đăng ký...' : 'Đăng ký'}
        </button>
      </form>
      <p className={styles.loginLink}>
        Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
      </p>
    </section>
  )
}

export default RegisterPage
