import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { addImage, listImages, removeImage, reorderImages } from '../../../services/catalog/adminProductService'
import { getApiErrorMessage } from '../../../utils/apiError'
import type { ProductImageResponse } from '../../../types/catalog/product'
import listStyles from '../adminList.module.css'
import tabStyles from './productTabs.module.css'

interface ProductImagesTabProps {
  productId: number
}

function ProductImagesTab({ productId }: ProductImagesTabProps) {
  const [images, setImages] = useState<ProductImageResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isAdding, setIsAdding] = useState(false)
  const [url, setUrl] = useState('')
  const [altText, setAltText] = useState('')
  const [isSavingAdd, setIsSavingAdd] = useState(false)
  const [removingId, setRemovingId] = useState<number | null>(null)
  const [isReordering, setIsReordering] = useState(false)

  function loadImages() {
    setIsLoading(true)
    setError(null)
    listImages(productId)
      .then(setImages)
      .catch((err: unknown) => setError(getApiErrorMessage(err)))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    loadImages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])

  async function handleAddSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSavingAdd(true)
    try {
      await addImage(productId, { url: url.trim(), altText: altText.trim() || undefined })
      setUrl('')
      setAltText('')
      setIsAdding(false)
      loadImages()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể thêm ảnh'))
    } finally {
      setIsSavingAdd(false)
    }
  }

  async function handleRemove(imageId: number) {
    if (!window.confirm('Xoá ảnh này khỏi sản phẩm?')) return
    setRemovingId(imageId)
    setError(null)
    try {
      await removeImage(productId, imageId)
      loadImages()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể xoá ảnh'))
    } finally {
      setRemovingId(null)
    }
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= images.length) return
    const reordered = [...images]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(targetIndex, 0, moved)
    setImages(reordered)
    setIsReordering(true)
    setError(null)
    try {
      const updated = await reorderImages(productId, { orderedImageIds: reordered.map((image) => image.id) })
      setImages(updated)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể sắp xếp lại ảnh'))
      loadImages()
    } finally {
      setIsReordering(false)
    }
  }

  return (
    <div>
      <div className={tabStyles.tabHeader}>
        <h3>{images.length} ảnh</h3>
        <button type="button" className={tabStyles.addButton} onClick={() => setIsAdding((prev) => !prev)}>
          {isAdding ? 'Đóng' : '+ Thêm ảnh'}
        </button>
      </div>

      {isAdding && (
        <form className={tabStyles.addForm} onSubmit={handleAddSubmit}>
          <label style={{ gridColumn: '1 / -1' }}>
            URL ảnh
            <input
              type="text"
              value={url}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setUrl(event.target.value)}
              placeholder="https://..."
              maxLength={500}
              required
            />
          </label>
          <label style={{ gridColumn: '1 / -1' }}>
            Alt text
            <input
              type="text"
              value={altText}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setAltText(event.target.value)}
              maxLength={255}
            />
          </label>
          <div className={tabStyles.addFormActions}>
            <button type="submit" className={tabStyles.addButton} disabled={isSavingAdd}>
              {isSavingAdd ? 'Đang lưu...' : 'Lưu ảnh'}
            </button>
          </div>
        </form>
      )}

      {error && <p className={listStyles.error}>{error}</p>}

      {isLoading ? (
        <p>Đang tải...</p>
      ) : images.length === 0 ? (
        <div className={listStyles.emptyState}>
          <p>Sản phẩm chưa có ảnh nào.</p>
        </div>
      ) : (
        <div className={tabStyles.imageGrid}>
          {images.map((image, index) => (
            <div key={image.id} className={tabStyles.imageCard}>
              <img src={image.url} alt={image.altText ?? ''} className={tabStyles.imageThumb} />
              <div className={tabStyles.imageCardBody}>
                <span className={tabStyles.imageAlt}>{image.altText || '(không có alt text)'}</span>
                <div className={tabStyles.imageActions}>
                  <div className={tabStyles.reorderButtons}>
                    <button type="button" disabled={index === 0 || isReordering} onClick={() => handleMove(index, -1)}>
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={index === images.length - 1 || isReordering}
                      onClick={() => handleMove(index, 1)}
                    >
                      ↓
                    </button>
                  </div>
                  <button
                    type="button"
                    className={listStyles.dangerLinkButton}
                    disabled={removingId === image.id}
                    onClick={() => handleRemove(image.id)}
                  >
                    Xoá
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ProductImagesTab
