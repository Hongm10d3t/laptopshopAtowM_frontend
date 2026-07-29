import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAppSelector } from '../hooks/useAppSelector'

// Bọc quanh route yêu cầu đã đăng nhập (customer.**). Đợi isRestoring xong
// (silent refresh lúc app mở, App.tsx) trước khi quyết định điều hướng —
// nếu không, F5 trang 1 route đã đăng nhập sẽ bị đá ra /login trong tích tắc
// trước khi kịp khôi phục phiên từ refresh token cookie.
function AuthGuard() {
  const { accessToken, isRestoring } = useAppSelector((state) => state.auth)
  const location = useLocation()

  if (isRestoring) {
    return null
  }

  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}

export default AuthGuard
