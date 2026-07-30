import { useEffect, useRef, useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { getActiveCategories } from '../../services/catalog/categoryService'
import type { CategoryPublicResponse } from '../../types/catalog/category'
import styles from './CategoryNav.module.css'

const MENU_ICON = (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
)

const CHEVRON_ICON = (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// Gói duy nhất gọi API thật ở Phase 1: GET /public/categories (danh mục
// ACTIVE). Danh sách sản phẩm theo category thật sự là việc của Gói 2.2.
function CategoryNav() {
  const [categories, setCategories] = useState<CategoryPublicResponse[]>([])
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let isMounted = true
    getActiveCategories()
      .then((data) => {
        if (isMounted) setCategories(data)
      })
      .catch(() => {
        if (isMounted) setCategories([])
      })
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <nav className={styles.nav}>
      <div className={styles.categoryMenu} ref={menuRef}>
        <button type="button" className={styles.categoryButton} onClick={() => setIsMenuOpen((open) => !open)}>
          <span className={styles.menuIcon}>{MENU_ICON}</span>
          Danh mục sản phẩm
          <span className={isMenuOpen ? styles.chevronOpen : styles.chevron}>{CHEVRON_ICON}</span>
        </button>
        {isMenuOpen && (
          <ul className={styles.dropdown}>
            {categories.length === 0 && <li className={styles.dropdownEmpty}>Đang tải danh mục...</li>}
            {categories.map((category) => (
              <li key={category.id}>
                <Link to={`/products?category=${category.slug}`} onClick={() => setIsMenuOpen(false)}>
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <ul className={styles.links}>
        <li>
          <NavLink to="/" end className={({ isActive }) => (isActive ? styles.linkActive : undefined)}>
            Trang chủ
          </NavLink>
        </li>
        <li>
          <NavLink to="/products" className={({ isActive }) => (isActive ? styles.linkActive : undefined)}>
            Sản phẩm
          </NavLink>
        </li>
        <li>
          <NavLink to="/compare" className={({ isActive }) => (isActive ? styles.linkActive : undefined)}>
            So sánh
          </NavLink>
        </li>
      </ul>
    </nav>
  )
}

export default CategoryNav
