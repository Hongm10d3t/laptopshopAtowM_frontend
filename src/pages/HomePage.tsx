import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/product/ProductCard'
import { getActiveBrands } from '../services/catalog/brandService'
import { searchProducts } from '../services/catalog/productService'
import { getApiErrorMessage } from '../utils/apiError'
import type { BrandPublicResponse } from '../types/catalog/brand'
import type { ProductListItemResponse } from '../types/catalog/product'
import styles from './HomePage.module.css'

const FEATURED_PRODUCT_COUNT = 8

// Backend không có khái niệm "sản phẩm nổi bật" (không có cột/flag nào cho
// việc này) — dùng sort=NEWEST làm "sản phẩm mới" thay vì bịa ra 1 khái niệm
// Backend không hỗ trợ. Banner là nội dung tĩnh (không có API quản lý banner).
function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<ProductListItemResponse[]>([])
  const [brands, setBrands] = useState<BrandPublicResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([searchProducts({ sort: 'NEWEST', page: 0, size: FEATURED_PRODUCT_COUNT }), getActiveBrands()])
      .then(([productPage, brandList]) => {
        setFeaturedProducts(productPage.content)
        setBrands(brandList)
      })
      .catch((err: unknown) => setError(getApiErrorMessage(err)))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.heroBadge}>Hiệu năng đỉnh cao</span>
          <h1>Nâng tầm trải nghiệm với laptop chính hãng</h1>
          <p>Hiệu năng mạnh mẽ – Thiết kế tinh tế. Bảo hành chính hãng – Giá tốt mỗi ngày.</p>
          <Link to="/products" className={styles.heroButton}>
            Khám phá ngay →
          </Link>
        </div>
      </section>

      {error && <p className={styles.error}>{error}</p>}

      <section>
        <div className={styles.sectionHeader}>
          <h2>Sản phẩm mới</h2>
          <Link to="/products">Xem tất cả →</Link>
        </div>
        {isLoading ? (
          <p>Đang tải...</p>
        ) : (
          <div className={styles.productGrid}>
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
            {featuredProducts.length === 0 && <p>Chưa có sản phẩm nào.</p>}
          </div>
        )}
      </section>

      <section>
        <h2>Thương hiệu nổi bật</h2>
        <div className={styles.brandRow}>
          {brands.map((brand) => (
            <div key={brand.id} className={styles.brandItem} title={brand.name}>
              {brand.logoUrl ? <img src={brand.logoUrl} alt={brand.name} /> : <span>{brand.name}</span>}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default HomePage
