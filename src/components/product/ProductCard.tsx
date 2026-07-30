import { Link } from 'react-router-dom'
import { formatPriceRange } from '../../utils/currency'
import type { ProductListItemResponse } from '../../types/catalog/product'
import styles from './ProductCard.module.css'

interface ProductCardProps {
  product: ProductListItemResponse
}

// Dùng chung cho mọi nơi hiển thị lưới sản phẩm (Trang chủ, Danh sách sản
// phẩm) — cùng 1 shape ProductListItemResponse nên chỉ cần 1 component.
function ProductCard({ product }: ProductCardProps) {
  return (
    <Link to={`/products/${product.slug}`} className={styles.card}>
      {product.thumbnailUrl ? (
        <img src={product.thumbnailUrl} alt={product.name} className={styles.image} />
      ) : (
        <div className={styles.imagePlaceholder}>{product.name}</div>
      )}
      <p className={styles.name}>{product.name}</p>
      <p className={styles.meta}>
        {product.brandName} · {product.categoryName}
      </p>
      <p className={styles.price}>{formatPriceRange(product.priceFrom, product.priceTo)}</p>
    </Link>
  )
}

export default ProductCard
