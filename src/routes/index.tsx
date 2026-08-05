import { Route, Routes } from 'react-router-dom'
import MainLayout from '../components/layout/MainLayout'
import AuthGuard from '../guard/AuthGuard'
import RoleGuard from '../guard/RoleGuard'
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
import OrderListPage from '../pages/account/OrderListPage'
import OrderDetailPage from '../pages/account/OrderDetailPage'
import CartPage from '../pages/cart/CartPage'
import CheckoutPage from '../pages/checkout/CheckoutPage'
import VnPayReturnPage from '../pages/payment/VnPayReturnPage'
import AdminLayout from '../pages/admin/AdminLayout'
import CategoryListPage from '../pages/admin/category/CategoryListPage'
import CategoryFormPage from '../pages/admin/category/CategoryFormPage'
import BrandListPage from '../pages/admin/brand/BrandListPage'
import BrandFormPage from '../pages/admin/brand/BrandFormPage'
import AdminProductListPage from '../pages/admin/product/ProductListPage'
import AdminProductFormPage from '../pages/admin/product/ProductFormPage'
import AdminProductDetailPage from '../pages/admin/product/ProductDetailPage'
import StockReceiptListPage from '../pages/admin/inventory/StockReceiptListPage'
import StockReceiptFormPage from '../pages/admin/inventory/StockReceiptFormPage'
import StockReceiptDetailPage from '../pages/admin/inventory/StockReceiptDetailPage'
import VariantInventoryPage from '../pages/admin/inventory/VariantInventoryPage'
import AdminOrderListPage from '../pages/admin/order/OrderListPage'
import AdminOrderDetailPage from '../pages/admin/order/OrderDetailPage'
import AdminReturnRequestListPage from '../pages/admin/return-request/ReturnRequestListPage'
import AdminReturnRequestDetailPage from '../pages/admin/return-request/ReturnRequestDetailPage'
import AdminPaymentListPage from '../pages/admin/payment/PaymentListPage'
import AdminPaymentDetailPage from '../pages/admin/payment/PaymentDetailPage'

// Route config tập trung tại đây. MainLayout bọc mọi route Storefront (Guest/
// Customer). Admin có layout riêng (AdminLayout, Phase 6) — KHÔNG lồng trong
// MainLayout vì Admin không dùng Header/TopBar/CategoryNav/Footer storefront.
// /admin/** đòi hỏi AuthGuard (đã đăng nhập) RỒI MỚI TỚI RoleGuard (đúng role
// ADMIN) — sai thứ tự sẽ đá thẳng người chưa đăng nhập về "/" thay vì
// "/login" kèm state.from.
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
        <Route path="/payment/vnpay-return" element={<VnPayReturnPage />} />

        <Route element={<AuthGuard />}>
          <Route element={<RoleGuard allowedRoles={['CUSTOMER']} />}>
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/account" element={<AccountLayout />}>
              <Route index element={<ProfilePage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="orders" element={<OrderListPage />} />
              <Route path="orders/:id" element={<OrderDetailPage />} />
              <Route path="addresses" element={<AddressListPage />} />
              <Route path="addresses/new" element={<AddressFormPage />} />
              <Route path="addresses/:id/edit" element={<AddressFormPage />} />
              <Route path="change-password" element={<ChangePasswordPage />} />
            </Route>
          </Route>
        </Route>
      </Route>

      <Route element={<AuthGuard />}>
        <Route element={<RoleGuard allowedRoles={['ADMIN']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<CategoryListPage />} />
            <Route path="orders" element={<AdminOrderListPage />} />
            <Route path="orders/:id" element={<AdminOrderDetailPage />} />
            <Route path="return-requests" element={<AdminReturnRequestListPage />} />
            <Route path="return-requests/:id" element={<AdminReturnRequestDetailPage />} />
            <Route path="payments" element={<AdminPaymentListPage />} />
            <Route path="payments/:id" element={<AdminPaymentDetailPage />} />
            <Route path="categories" element={<CategoryListPage />} />
            <Route path="categories/new" element={<CategoryFormPage />} />
            <Route path="categories/:id/edit" element={<CategoryFormPage />} />
            <Route path="brands" element={<BrandListPage />} />
            <Route path="brands/new" element={<BrandFormPage />} />
            <Route path="brands/:id/edit" element={<BrandFormPage />} />
            <Route path="products" element={<AdminProductListPage />} />
            <Route path="products/new" element={<AdminProductFormPage />} />
            <Route path="products/:id" element={<AdminProductDetailPage />} />
            <Route path="inventory/receipts" element={<StockReceiptListPage />} />
            <Route path="inventory/receipts/new" element={<StockReceiptFormPage />} />
            <Route path="inventory/receipts/:id" element={<StockReceiptDetailPage />} />
            <Route path="inventory/variants/:variantId" element={<VariantInventoryPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}

export default AppRoutes
