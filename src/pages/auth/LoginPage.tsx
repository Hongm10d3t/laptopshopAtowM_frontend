import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { login } from '../../services/auth/authService'
import { getApiErrorCode, getApiErrorMessage } from '../../utils/apiError'
import styles from './LoginPage.module.css'

interface LocationState {
  from?: { pathname: string }
}

interface FormState {
  email: string
  password: string
}

const INITIAL_STATE: FormState = { email: '', password: '' }

function LoginPage() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE)
  const [error, setError] = useState<string | null>(null)
  // ACCOUNT_NOT_VERIFIED là lỗi thường gặp nhất lúc demo (đăng ký xong quên
  // xác thực email) — gợi ý thẳng link sang trang xác thực thay vì chỉ hiện
  // message chung chung.
  const [isNotVerified, setIsNotVerified] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  // AuthGuard (Gói 1.4) điều hướng sang đây kèm state.from = trang người
  // dùng định vào trước khi bị chặn — đăng nhập xong quay lại đúng đó thay
  // vì luôn về "/".
  const from = (location.state as LocationState | null)?.from?.pathname ?? '/'

  function handleChange(field: keyof FormState) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }))
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!form.email.trim() || !form.password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu')
      setIsNotVerified(false)
      return
    }
    setError(null)
    setIsNotVerified(false)
    setIsSubmitting(true)
    try {
      await login({ email: form.email.trim(), password: form.password })
      navigate(from, { replace: true })
    } catch (err) {
      setError(getApiErrorMessage(err))
      setIsNotVerified(getApiErrorCode(err) === 'ACCOUNT_NOT_VERIFIED')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className={styles.wrapper}>
      <h1>Đăng nhập</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          Email
          <input type="email" value={form.email} onChange={handleChange('email')} required />
        </label>
        <label className={styles.field}>
          Mật khẩu
          <input type="password" value={form.password} onChange={handleChange('password')} required />
        </label>

        {error && (
          <p className={styles.error}>
            {error}
            {isNotVerified && (
              <>
                {' '}
                <Link to="/verify-email">Xác thực email ngay</Link>
              </>
            )}
          </p>
        )}

        <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
          {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>
      <p className={styles.registerLink}>
        Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
      </p>
    </section>
  )
}

export default LoginPage
