import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppSelector } from '../../hooks/useAppSelector'
import { logout } from '../../services/auth/authService'
import TopBar from './TopBar'
import CategoryNav from './CategoryNav'
import styles from './Header.module.css'

const SEARCH_ICON = (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.6" />
    <line x1="13.8" y1="14" x2="18" y2="18.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
)

const USER_ICON = (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="10" cy="6.5" r="3" stroke="currentColor" strokeWidth="1.5" />
    <path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const ORDER_ICON = (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <rect x="4" y="2.5" width="12" height="15" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M7 7h6M7 10.5h6M7 14h3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
)

const CART_ICON = (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M3 3h1.5l1.6 9.6a1.5 1.5 0 0 0 1.5 1.4h6.8a1.5 1.5 0 0 0 1.5-1.2L17.5 6.5H5.3"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="8" cy="17" r="1.2" fill="currentColor" />
    <circle cx="14.5" cy="17" r="1.2" fill="currentColor" />
  </svg>
)

// Giỏ hàng CHƯA nối vào cartSlice thật — đó là việc của Gói 3.1. Trạng thái
// đăng nhập ở đây đã là thật (authSlice, Gói 1.3).
function Header() {
  const { accessToken, email } = useAppSelector((state) => state.auth)
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')

  function handleSearchSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = keyword.trim()
    navigate(trimmed ? `/products?keyword=${encodeURIComponent(trimmed)}` : '/products')
  }

  // window.confirm — đủ dùng cho 1 xác nhận đơn giản, chưa cần dựng hệ thống
  // modal riêng chỉ vì 1 chỗ dùng.
  async function handleLogout() {
    if (!window.confirm('Bạn có chắc muốn đăng xuất?')) {
      return
    }
    await logout()
    navigate('/')
  }

  return (
    <header className={styles.header}>
      <TopBar />
      <div className={styles.mainRow}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoMark}>H</span>
          <span className={styles.logoText}>
            Laptop<span className={styles.logoAccent}>Hub</span>
          </span>
        </Link>

        <form className={styles.searchForm} role="search" onSubmit={handleSearchSubmit}>
          <span className={styles.searchIcon}>{SEARCH_ICON}</span>
          <input
            type="search"
            name="q"
            placeholder="Bạn cần tìm laptop gì hôm nay?"
            className={styles.searchInput}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <button type="submit" className={styles.searchButton}>
            Tìm kiếm
          </button>
        </form>

        <div className={styles.actions}>
          <Link to="/account/orders" className={styles.actionItem}>
            <span className={styles.actionIcon}>{ORDER_ICON}</span>
            <span className={styles.actionText}>
              <span className={styles.actionLabel}>Đơn hàng</span>
              <span className={styles.actionSub}>Theo dõi đơn</span>
            </span>
          </Link>
          {accessToken ? (
            <div className={styles.accountMenu}>
              <Link to="/account/profile" className={styles.actionItem}>
                <span className={styles.actionIcon}>{USER_ICON}</span>
                <span className={styles.actionText}>
                  <span className={styles.actionLabel}>{email}</span>
                  <span className={styles.actionSub}>Tài khoản</span>
                </span>
              </Link>
              <button type="button" className={styles.logoutButton} onClick={handleLogout}>
                Đăng xuất
              </button>
            </div>
          ) : (
            <Link to="/login" className={styles.actionItem}>
              <span className={styles.actionIcon}>{USER_ICON}</span>
              <span className={styles.actionText}>
                <span className={styles.actionLabel}>Tài khoản</span>
                <span className={styles.actionSub}>Đăng nhập</span>
              </span>
            </Link>
          )}
          <Link to="/cart" className={styles.actionItem}>
            <span className={styles.actionIcon}>
              {CART_ICON}
              <span className={styles.cartBadge}>0</span>
            </span>
            <span className={styles.actionText}>
              <span className={styles.actionLabel}>Giỏ hàng</span>
              <span className={styles.actionSub}>Xem giỏ</span>
            </span>
          </Link>
        </div>
      </div>
      <CategoryNav />
    </header>
  )
}

export default Header
