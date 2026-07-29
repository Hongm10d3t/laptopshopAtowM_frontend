import { Route, Routes } from 'react-router-dom'
import HomePage from '../pages/HomePage'

// Route config tập trung tại đây. Chỉ có "/" ở foundation phase — route
// Login/Product/Admin... sẽ thêm khi implement từng feature. AuthGuard/
// RoleGuard (folder guard/) chưa áp dụng ở đây, để dành Authentication phase.
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
    </Routes>
  )
}

export default AppRoutes
