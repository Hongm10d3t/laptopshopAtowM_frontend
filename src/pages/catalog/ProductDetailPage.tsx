import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import StarRating from '../../components/review/StarRating'
import { getProductBySlug } from '../../services/catalog/productService'
import { getProductReviews, getReviewSummary } from '../../services/review/reviewService'
import { formatCurrency } from '../../utils/currency'
import { formatDate } from '../../utils/date'
import { getApiErrorMessage } from '../../utils/apiError'
import type { ProductDetailResponse, ProductSpecValueResponse } from '../../types/catalog/product'
import type { ReviewResponse, ReviewSummaryResponse } from '../../types/review/review'
import type { PageResponse } from '../../types/common/pageResponse'
import styles from './ProductDetailPage.module.css'

const REVIEW_PAGE_SIZE = 5

function groupSpecifications(specs: ProductSpecValueResponse[]): [string, ProductSpecValueResponse[]][] {
  const groups = new Map<string, ProductSpecValueResponse[]>()
  for (const spec of specs) {
    const existing = groups.get(spec.groupLabel)
    if (existing) existing.push(spec)
    else groups.set(spec.groupLabel, [spec])
  }
  return Array.from(groups.entries())
}

// Chi tiết sản phẩm: ảnh + chọn variant + thông số kỹ thuật (nhóm theo
// groupLabel) + rating summary + danh sách review (chỉ đọc — viết đánh giá
// là việc của Gói 4.4, cần đơn hàng DELIVERED nên chưa làm ở đây). Nút
// "Thêm vào giỏ" chưa có vì Giỏ hàng là Gói 3.1, chưa tồn tại API/state để
// gọi thật.
function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()

  const [product, setProduct] = useState<ProductDetailResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  const [reviewSummary, setReviewSummary] = useState<ReviewSummaryResponse | null>(null)
  const [reviewPageInfo, setReviewPageInfo] = useState<Omit<PageResponse<ReviewResponse>, 'content'> | null>(null)
  const [reviews, setReviews] = useState<ReviewResponse[]>([])
  const [reviewPage, setReviewPage] = useState(1)
  const [isReviewsLoading, setIsReviewsLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    setIsLoading(true)
    setError(null)
    setProduct(null)
    getProductBySlug(slug)
      .then((data) => {
        setProduct(data)
        setSelectedVariantId(data.variants[0]?.id ?? null)
        setActiveImageIndex(0)
        setReviewPage(1)
      })
      .catch((err: unknown) => setError(getApiErrorMessage(err, 'Không tìm thấy sản phẩm')))
      .finally(() => setIsLoading(false))
  }, [slug])

  useEffect(() => {
    if (!product) return
    getReviewSummary(product.id)
      .then(setReviewSummary)
      .catch(() => setReviewSummary(null))
  }, [product])

  useEffect(() => {
    if (!product) return
    setIsReviewsLoading(true)
    getProductReviews(product.id, { page: reviewPage - 1, size: REVIEW_PAGE_SIZE })
      .then((result) => {
        setReviews(result.content)
        setReviewPageInfo(result)
      })
      .catch(() => {
        setReviews([])
        setReviewPageInfo(null)
      })
      .finally(() => setIsReviewsLoading(false))
  }, [product, reviewPage])

  if (isLoading) {
    return <p>Đang tải...</p>
  }

  if (error || !product) {
    return <p className={styles.error}>{error ?? 'Không tìm thấy sản phẩm'}</p>
  }

  const selectedVariant = product.variants.find((variant) => variant.id === selectedVariantId) ?? product.variants[0]
  const activeImage = product.images[activeImageIndex] ?? product.images[0]
  const specGroups = groupSpecifications(product.specifications)

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="breadcrumb">
        <Link to="/">Trang chủ</Link>
        <span>/</span>
        <Link to="/products">{product.categoryName}</Link>
        <span>/</span>
        <span className={styles.breadcrumbCurrent}>{product.name}</span>
      </nav>

      <div className={styles.mainGrid}>
        <div className={styles.gallery}>
          {activeImage ? (
            <img src={activeImage.url} alt={activeImage.altText ?? product.name} className={styles.mainImage} />
          ) : (
            <div className={styles.imagePlaceholder}>{product.name}</div>
          )}
          {product.images.length > 1 && (
            <div className={styles.thumbnailRow}>
              {product.images.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  className={index === activeImageIndex ? styles.thumbnailActive : styles.thumbnail}
                  onClick={() => setActiveImageIndex(index)}
                >
                  <img src={image.url} alt={image.altText ?? product.name} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.info}>
          <p className={styles.brand}>{product.brandName}</p>
          <h1 className={styles.name}>{product.name}</h1>

          <div className={styles.ratingRow}>
            {reviewSummary && reviewSummary.reviewCount > 0 ? (
              <>
                <StarRating rating={reviewSummary.averageRating ?? 0} />
                <span className={styles.ratingText}>
                  {reviewSummary.averageRating?.toFixed(1)}/5 ({reviewSummary.reviewCount} đánh giá)
                </span>
              </>
            ) : (
              <span className={styles.ratingText}>Chưa có đánh giá</span>
            )}
          </div>

          {product.shortDescription && <p className={styles.shortDesc}>{product.shortDescription}</p>}

          {selectedVariant && <p className={styles.price}>{formatCurrency(selectedVariant.price)}</p>}

          {product.variants.length > 0 && (
            <div className={styles.variantBlock}>
              <p className={styles.variantLabel}>Phiên bản</p>
              <div className={styles.variantList}>
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    type="button"
                    className={variant.id === selectedVariant?.id ? styles.variantActive : styles.variant}
                    onClick={() => setSelectedVariantId(variant.id)}
                  >
                    {variant.variantName}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedVariant && (
            <dl className={styles.variantMeta}>
              <div>
                <dt>SKU</dt>
                <dd>{selectedVariant.sku}</dd>
              </div>
              {selectedVariant.color && (
                <div>
                  <dt>Màu sắc</dt>
                  <dd>{selectedVariant.color}</dd>
                </div>
              )}
            </dl>
          )}
        </div>
      </div>

      {product.description && (
        <section className={styles.section}>
          <h2>Mô tả sản phẩm</h2>
          <p className={styles.description}>{product.description}</p>
        </section>
      )}

      {specGroups.length > 0 && (
        <section className={styles.section}>
          <h2>Thông số kỹ thuật</h2>
          <div className={styles.specGroups}>
            {specGroups.map(([groupLabel, specs]) => (
              <div key={groupLabel} className={styles.specGroup}>
                <h3>{groupLabel}</h3>
                <dl className={styles.specList}>
                  {specs.map((spec) => (
                    <div key={spec.specificationDefinitionId} className={styles.specRow}>
                      <dt>{spec.label}</dt>
                      <dd>
                        {spec.value}
                        {spec.unit ? ` ${spec.unit}` : ''}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className={styles.section}>
        <h2>Đánh giá từ khách hàng</h2>
        {reviewSummary && reviewSummary.reviewCount > 0 && (
          <div className={styles.reviewSummary}>
            <span className={styles.reviewSummaryScore}>{reviewSummary.averageRating?.toFixed(1)}</span>
            <div>
              <StarRating rating={reviewSummary.averageRating ?? 0} />
              <p className={styles.ratingText}>{reviewSummary.reviewCount} đánh giá</p>
            </div>
          </div>
        )}

        {isReviewsLoading ? (
          <p>Đang tải đánh giá...</p>
        ) : reviews.length === 0 ? (
          <p>Chưa có đánh giá nào cho sản phẩm này.</p>
        ) : (
          <ul className={styles.reviewList}>
            {reviews.map((review) => (
              <li key={review.id} className={styles.reviewItem}>
                <div className={styles.reviewHeader}>
                  <span className={styles.reviewerName}>{review.reviewerName}</span>
                  <span className={styles.reviewDate}>{formatDate(review.createdAt)}</span>
                </div>
                <StarRating rating={review.rating} />
                {review.comment && <p className={styles.reviewComment}>{review.comment}</p>}
              </li>
            ))}
          </ul>
        )}

        {reviewPageInfo && reviewPageInfo.totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              type="button"
              disabled={reviewPage <= 1}
              onClick={() => setReviewPage((current) => current - 1)}
            >
              ← Trước
            </button>
            <span>
              Trang {reviewPage} / {reviewPageInfo.totalPages}
            </span>
            <button
              type="button"
              disabled={reviewPageInfo.last}
              onClick={() => setReviewPage((current) => current + 1)}
            >
              Sau →
            </button>
          </div>
        )}
      </section>
    </div>
  )
}

export default ProductDetailPage
