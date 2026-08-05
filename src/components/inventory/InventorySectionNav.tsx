import { NavLink, useLocation } from 'react-router-dom'
import styles from './InventorySectionNav.module.css'

const STOCK_ICON = (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M3 6.1 10 2.8l7 3.3v7.8L10 17.2 3 13.9V6.1Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M3 6.2 10 9.6l7-3.4M10 9.6v7.6" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
)

const RECEIPT_ICON = (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M5 2.8h8.2A1.8 1.8 0 0 1 15 4.6v12.1l-2.1-1.2-2 1.2-2-1.2-2.1 1.2V4.6A1.8 1.8 0 0 0 5 2.8Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M8.8 6.4h3.7M8.8 9.2h3.7M8.8 12h2.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M5 2.8a1.8 1.8 0 0 0-1.8 1.8v.8h3.6v-.8A1.8 1.8 0 0 0 5 2.8Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
)

function InventorySectionNav() {
  const { pathname } = useLocation()
  const isStockActive = pathname === '/admin/inventory' || pathname.startsWith('/admin/inventory/variants/')

  return (
    <nav className={styles.nav} aria-label="Điều hướng kho hàng">
      <NavLink
        to="/admin/inventory"
        className={isStockActive ? styles.linkActive : styles.link}
      >
        <span className={styles.icon}>{STOCK_ICON}</span>
        <span>
          <strong>Tồn kho hiện tại</strong>
          <small>Tra cứu theo sản phẩm và SKU</small>
        </span>
      </NavLink>
      <NavLink
        to="/admin/inventory/receipts"
        className={({ isActive }) => (isActive ? styles.linkActive : styles.link)}
      >
        <span className={styles.icon}>{RECEIPT_ICON}</span>
        <span>
          <strong>Phiếu nhập kho</strong>
          <small>Tạo và theo dõi các lần nhập hàng</small>
        </span>
      </NavLink>
    </nav>
  )
}

export default InventorySectionNav
