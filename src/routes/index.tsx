import { Route, Routes } from 'react-router-dom'
import MainLayout from '../components/layout/MainLayout'
import AuthGuard from '../guard/AuthGuard'
import HomePage from '../pages/HomePage'
import ProductListPage from '../pages/catalog/ProductListPage'
import ProductDetailPage from '../pages/catalog/ProductDetailPage'
import ComparePage from '../pages/catalog/ComparePage'
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import VerifyEmailPage from '../pages/auth/VerifyEmailPage'
import AccountLayout from '../pages/account/AccountLayout'
import AddressFormPage from '../pages/account/AddressFormPage'
import AddressListPage from '../pages/account/AddressListPage'
import ChangePasswordPage from '../pages/account/ChangePasswordPage'
import ProfilePage from '../pages/account/ProfilePage'
import CartPage from '../pages/cart/CartPage'
import CheckoutPage from '../pages/checkout/CheckoutPage'

// Route config tập trung tại đây. MainLayout bọc mọi route Storefront (Guest/
// Customer) — Admin sẽ có layout riêng, thêm route "/admin/**" ở Phase 6-9.
// RoleGuard (folder guard/) chưa có route nào dùng — áp dụng khi tới /admin/**.
function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductListPage />} />
        <Route path="/products/:slug" element={<ProductDetailPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        <Route element={<AuthGuard />}>
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/account" element={<AccountLayout />}>
            <Route index element={<ProfilePage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="addresses" element={<AddressListPage />} />
            <Route path="addresses/new" element={<AddressFormPage />} />
            <Route path="addresses/:id/edit" element={<AddressFormPage />} />
            <Route path="change-password" element={<ChangePasswordPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}

export default AppRoutes
