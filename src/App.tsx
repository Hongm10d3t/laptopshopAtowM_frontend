import { useEffect, useRef } from 'react'
import { restoreSession } from './services/auth/authService'
import AppRoutes from './routes'

function App() {
  // accessToken chỉ sống trong Redux (mất khi F5) — thử khôi phục phiên từ
  // refresh token cookie (còn hạn 30 ngày) ngay lúc app mở, để không bắt
  // đăng nhập lại mỗi lần reload trang. hasAttemptedRef chống StrictMode
  // (dev) gọi effect 2 lần — gọi /auth/refresh 2 lần gần như đồng thời với
  // cùng 1 cookie sẽ khiến lần 2 bị coi là "reuse" và revoke luôn cả phiên
  // lần 1 vừa tạo (xem RefreshService.java — đã tự gặp lỗi này ở VerifyEmailPage,
  // áp dụng lại đúng cách chống).
  const hasAttemptedRef = useRef(false)

  useEffect(() => {
    if (hasAttemptedRef.current) {
      return
    }
    hasAttemptedRef.current = true
    restoreSession()
  }, [])

  return <AppRoutes />
}

export default App
