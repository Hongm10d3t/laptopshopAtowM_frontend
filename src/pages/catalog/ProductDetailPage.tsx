import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import QuantityStepper from '../../components/cart/QuantityStepper'
import StarRating from '../../components/review/StarRating'
import { useAppDispatch } from '../../hooks/useAppDispatch'
import { useAppSelector } from '../../hooks/useAppSelector'
import { addCompareItem, openCompareSelector, removeCompareItem } from '../../redux/slices/compareSlice'
import { addCartItem } from '../../services/cart/cartService'
import { getProductBySlug } from '../../services/catalog/productService'
import { getProductReviews, getReviewSummary } from '../../services/review/reviewService'
import { formatCurrency } from '../../utils/currency'
import { formatDate } from '../../utils/date'
import { getApiErrorMessage } from '../../utils/apiError'
import type { ProductDetailResponse, ProductSpecValueResponse } from '../../types/catalog/product'
import type { ReviewResponse, ReviewSummaryResponse } from '../../types/review/review'
import type { PageResponse } from '../../types/common/pageResponse'
import styles from './ProductDetailPage.module.css'

const MAX_COMPARE_ITEMS = 3
const ADD_TO_CART_MESSAGE_MS = 2500

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
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const compareItems = useAppSelector((state) => state.compare.items)
  const { accessToken, role } = useAppSelector((state) => state.auth)

  const [product, setProduct] = useState<ProductDetailResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [addToCartError, setAddToCartError] = useState<string | null>(null)
  const [addToCartSuccess, setAddToCartSuccess] = useState(false)

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
        setQuantity(1)
        setAddToCartSuccess(false)
        setAddToCartError(null)
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
    if (!addToCartSuccess) return
    const timer = setTimeout(() => setAddToCartSuccess(false), ADD_TO_CART_MESSAGE_MS)
    return () => clearTimeout(timer)
  }, [addToCartSuccess])

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

  const isInCompare = compareItems.some((item) => item.variantId === selectedVariant?.id)

  // Backend chỉ enforce "cùng danh mục" lúc gọi API compare thật (Gói
  // ComparePage) — chặn sớm ở đây chỉ để tránh người dùng thêm nhầm rồi mới
  // biết lỗi, không thay thế validation phía Backend.
  function handleToggleCompare() {
    if (!selectedVariant || !product) return
    if (isInCompare) {
      dispatch(removeCompareItem(selectedVariant.id))
      return
    }
    if (compareItems.length >= MAX_COMPARE_ITEMS) {
      window.alert(`Chỉ có thể so sánh tối đa ${MAX_COMPARE_ITEMS} sản phẩm. Vui lòng bỏ bớt trước khi thêm mới.`)
      return
    }
    const conflictingItem = compareItems.find((item) => item.categoryName !== product.categoryName)
    if (conflictingItem) {
      window.alert(`Chỉ so sánh được các sản phẩm cùng danh mục "${conflictingItem.categoryName}".`)
      return
    }
    dispatch(
      addCompareItem({
        variantId: selectedVariant.id,
        productId: product.id,
        productSlug: product.slug,
        productName: product.name,
        variantName: selectedVariant.variantName,
        categoryName: product.categoryName,
        thumbnailUrl: activeImage?.url ?? null,
      }),
    )
    // Mở luôn modal gợi ý sản phẩm cùng danh mục thay vì bắt người dùng quay
    // lại tìm sản phẩm khác để so sánh cùng.
    dispatch(openCompareSelector())
  }

  // /customer/cart/items yêu cầu đã đăng nhập — chặn sớm bằng accessToken
  // thay vì để request thật ra 401 rồi hiện lỗi refresh-token khó hiểu, điều
  // hướng sang /login kèm "from" giống AuthGuard để quay lại đúng trang này
  // sau khi đăng nhập.
  async function handleAddToCart() {
    if (!selectedVariant) return
    if (!accessToken) {
      navigate('/login', { state: { from: location } })
      return
    }
    if (role !== 'CUSTOMER') {
      setAddToCartError('Tài khoản quản trị không thể mua hàng. Vui lòng dùng tài khoản khách hàng.')
      return
    }
    setIsAddingToCart(true)
    setAddToCartError(null)
    setAddToCartSuccess(false)
    try {
      await addCartItem(selectedVariant.id, quantity)
      setAddToCartSuccess(true)
    } catch (err) {
      setAddToCartError(getApiErrorMessage(err, 'Không thể thêm sản phẩm vào giỏ hàng'))
    } finally {
      setIsAddingToCart(false)
    }
  }

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
                    onClick={() => {
                      setSelectedVariantId(variant.id)
                      setQuantity(1)
                      setAddToCartSuccess(false)
                      setAddToCartError(null)
                    }}
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

          {selectedVariant && (
            <div className={styles.cartRow}>
              <QuantityStepper value={quantity} disabled={isAddingToCart} onChange={setQuantity} />
              <button
                type="button"
                className={styles.addToCartButton}
                disabled={isAddingToCart}
                onClick={handleAddToCart}
              >
                {isAddingToCart ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
              </button>
            </div>
          )}
          {addToCartSuccess && <p className={styles.addToCartSuccess}>Đã thêm vào giỏ hàng.</p>}
          {addToCartError && <p className={styles.addToCartErrorText}>{addToCartError}</p>}

          {selectedVariant && (
            <button
              type="button"
              className={isInCompare ? styles.compareButtonActive : styles.compareButton}
              onClick={handleToggleCompare}
            >
              {isInCompare ? '✓ Đang so sánh' : '+ Thêm vào so sánh'}
            </button>
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
