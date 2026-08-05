import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAppSelector } from '../../hooks/useAppSelector'
import { logout } from '../../services/auth/authService'
import styles from './AdminLayout.module.css'

const ORDER_ICON = (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <rect x="3" y="3.2" width="14" height="13.6" rx="2" stroke="currentColor" strokeWidth="1.4" />
    <path d="M6.2 7h7.6M6.2 10h7.6M6.2 13h4.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
)



const PAYMENT_ICON = (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <rect
      x="2.8"
      y="4.2"
      width="14.4"
      height="11.6"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.4"
    />
    <path d="M2.8 7.7h14.4" stroke="currentColor" strokeWidth="1.4" />
    <path
      d="M5.5 12.2h3.2M12.8 12.2h1.7"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  </svg>
)

const RETURN_ICON = (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M6.4 5.2H15a2 2 0 0 1 2 2v6.2a2 2 0 0 1-2 2H7.5"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
    <path
      d="m6.4 2.9-3 2.8 3 2.8M3.7 5.7h7.1"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const CATEGORY_ICON = (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M3 5.5A1.5 1.5 0 0 1 4.5 4h4.086a1.5 1.5 0 0 1 1.06.44l6.415 6.414a1.5 1.5 0 0 1 0 2.122l-4.085 4.085a1.5 1.5 0 0 1-2.122 0L3.44 10.646A1.5 1.5 0 0 1 3 9.586V5.5Z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
    <circle cx="6.75" cy="7.25" r="0.9" fill="currentColor" />
  </svg>
)

const BRAND_ICON = (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M10 3.2 12 7.4l4.6.7-3.3 3.2.8 4.5L10 13.7l-4.1 2.1.8-4.5-3.3-3.2 4.6-.7L10 3.2Z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  </svg>
)

const PRODUCT_ICON = (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M3.5 6.2 10 3l6.5 3.2v7.1L10 17l-6.5-3.7V6.2Z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
    <path d="M3.6 6.4 10 9.7l6.4-3.3M10 9.7V17" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
)

const INVENTORY_ICON = (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M2.8 6 10 2.5 17.2 6v8L10 17.5 2.8 14V6Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M2.8 6 10 9.5 17.2 6M10 9.5v8" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
)

// Chỉ thêm menu khi màn hình tương ứng đã có route thật, tránh link chết.
const NAV_ITEMS = [
  { to: '/admin/orders', label: 'Đơn hàng', icon: ORDER_ICON },
  { to: '/admin/return-requests', label: 'Trả hàng', icon: RETURN_ICON },
  { to: '/admin/payments', label: 'Thanh toán', icon: PAYMENT_ICON },
  { to: '/admin/categories', label: 'Danh mục', icon: CATEGORY_ICON },
  { to: '/admin/brands', label: 'Thương hiệu', icon: BRAND_ICON },
  { to: '/admin/products', label: 'Sản phẩm', icon: PRODUCT_ICON },
  { to: '/admin/inventory/receipts', label: 'Phiếu nhập kho', icon: INVENTORY_ICON },
]

function AdminLayout() {
  const { email } = useAppSelector((state) => state.auth)
  const navigate = useNavigate()

  async function handleLogout() {
    if (!window.confirm('Bạn có chắc muốn đăng xuất?')) {
      return
    }
    await logout()
    navigate('/login')
  }

  return (
    <div className={styles.wrapper}>
      <aside className={styles.sidebar}>
        <NavLink to="/admin" className={styles.brand}>
          <span className={styles.brandMark}>H</span>
          <span className={styles.brandText}>
            Laptop<span className={styles.brandAccent}>Hub</span>
          </span>
        </NavLink>
        <span className={styles.brandTag}>Quản trị viên</span>

        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? styles.navLinkActive : styles.navLink)}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.adminInfo}>
            <span className={styles.adminEmail}>{email}</span>
            <span className={styles.adminRole}>Quản trị viên</span>
          </div>
          <NavLink to="/" className={styles.storefrontLink}>
            ← Về trang khách
          </NavLink>
          <button type="button" className={styles.logoutButton} onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </aside>

      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout
