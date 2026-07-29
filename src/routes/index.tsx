import { Route, Routes } from 'react-router-dom'
import MainLayout from '../components/layout/MainLayout'
import HomePage from '../pages/HomePage'

// Route config tập trung tại đây. MainLayout bọc mọi route Storefront (Guest/
// Customer) — Admin sẽ có layout riêng, thêm route "/admin/**" ở Phase 6-9.
// AuthGuard/RoleGuard (folder guard/) chưa áp dụng ở đây, để dành Gói 1.4.
function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
      </Route>
    </Routes>
  )
}

export default AppRoutes
