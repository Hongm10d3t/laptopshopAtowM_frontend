import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { resendVerificationEmail, verifyEmail } from '../../services/auth/authService'
import { getApiErrorMessage } from '../../utils/apiError'
import styles from './VerifyEmailPage.module.css'

type VerifyStatus = 'idle' | 'verifying' | 'success' | 'error'

// Trang này tự gọi POST /auth/verify-email bằng token lấy từ query string
// (?token=...) — đúng thiết kế nêu ở AuthController/RegisterService: link
// trong email trỏ về đây, không phải gọi thẳng endpoint Backend từ email.
function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const tokenFromUrl = searchParams.get('token')

  const [status, setStatus] = useState<VerifyStatus>('idle')
  const [message, setMessage] = useState<string | null>(null)

  const [resendEmail, setResendEmail] = useState('')
  const [resendMessage, setResendMessage] = useState<string | null>(null)
  const [isResending, setIsResending] = useState(false)

  // Backend xoá email_verification_token_hash ngay khi verify thành công
  // (chống double-click) — nghĩa là gọi verify-email 2 lần với cùng token,
  // lần 2 sẽ luôn báo "token không hợp lệ" dù lần 1 đã set ACTIVE thật.
  // React StrictMode (dev) cố tình chạy lại effect này 2 lần để phát hiện
  // side-effect không an toàn — nếu không chặn, request thứ 2 sẽ ghi đè kết
  // quả thành công của request thứ 1 bằng lỗi. verifiedTokenRef đảm bảo chỉ
  // gọi API đúng 1 lần cho mỗi token, bất kể effect bị gọi lại bao nhiêu lần.
  const verifiedTokenRef = useRef<string | null>(null)

  useEffect(() => {
    if (!tokenFromUrl || verifiedTokenRef.current === tokenFromUrl) {
      return
    }
    verifiedTokenRef.current = tokenFromUrl
    setStatus('verifying')
    verifyEmail({ token: tokenFromUrl })
      .then(() => setStatus('success'))
      .catch((err: unknown) => {
        setStatus('error')
        setMessage(getApiErrorMessage(err, 'Xác thực email thất bại'))
      })
  }, [tokenFromUrl])

  async function handleResend(event: FormEvent) {
    event.preventDefault()
    if (!resendEmail.trim()) {
      return
    }
    setIsResending(true)
    setResendMessage(null)
    try {
      await resendVerificationEmail({ email: resendEmail.trim() })
      setResendMessage('Nếu email tồn tại và chưa xác thực, email xác thực mới đã được gửi.')
    } catch (err) {
      setResendMessage(getApiErrorMessage(err))
    } finally {
      setIsResending(false)
    }
  }

  return (
    <section className={styles.wrapper}>
      <h1>Xác thực email</h1>

      {!tokenFromUrl && (
        <p>Không tìm thấy token xác thực trong đường dẫn. Dùng link trong email, hoặc gửi lại email bên dưới.</p>
      )}
      {status === 'verifying' && <p>Đang xác thực...</p>}
      {status === 'success' && (
        <p className={styles.success}>
          Xác thực email thành công! Bạn có thể <Link to="/login">đăng nhập</Link> ngay bây giờ.
        </p>
      )}
      {status === 'error' && <p className={styles.error}>{message}</p>}

      <div className={styles.resendBox}>
        <h2>Gửi lại email xác thực</h2>
        <form className={styles.resendForm} onSubmit={handleResend}>
          <input
            type="email"
            placeholder="Nhập email đã đăng ký"
            value={resendEmail}
            onChange={(event) => setResendEmail(event.target.value)}
            required
          />
          <button type="submit" disabled={isResending}>
            {isResending ? 'Đang gửi...' : 'Gửi lại'}
          </button>
        </form>
        {resendMessage && <p className={styles.resendMessage}>{resendMessage}</p>}
      </div>
    </section>
  )
}

export default VerifyEmailPage
