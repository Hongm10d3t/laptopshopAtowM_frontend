import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getActiveCategories } from '../../services/catalog/categoryService'
import type { CategoryPublicResponse } from '../../types/catalog/category'
import styles from './CategoryNav.module.css'

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
          Danh mục sản phẩm
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
          <Link to="/">Trang chủ</Link>
        </li>
        <li>
          <Link to="/products">Sản phẩm</Link>
        </li>
        <li>
          <Link to="/compare">So sánh</Link>
        </li>
      </ul>
    </nav>
  )
}

export default CategoryNav
