import { Navigate, Outlet } from 'react-router-dom'
import { useAppSelector } from '../hooks/useAppSelector'
import type { UserRole } from '../types/auth/session'

interface RoleGuardProps {
  allowedRoles: UserRole[]
}

// Bọc quanh route yêu cầu đúng role (vd admin.**, Phase 6-9) — dùng SAU
// AuthGuard trong cây route (route lồng), không tự kiểm tra "đã đăng nhập
// chưa" vì AuthGuard đã lo việc đó. Chưa có route nào dùng tới ở Gói 1.4 —
// dựng sẵn theo đúng kế hoạch, áp dụng thật khi bắt đầu route /admin/**.
function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const { role } = useAppSelector((state) => state.auth)

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export default RoleGuard
