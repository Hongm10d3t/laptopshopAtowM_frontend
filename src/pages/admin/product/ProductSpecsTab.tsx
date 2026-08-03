import { useEffect, useState, type FormEvent } from 'react'
import { listSpecificationValues, upsertSpecifications } from '../../../services/catalog/adminProductService'
import { listSpecificationDefinitions } from '../../../services/catalog/adminSpecificationService'
import { getApiErrorMessage } from '../../../utils/apiError'
import type { SpecificationDefinitionResponse } from '../../../types/catalog/product'
import listStyles from '../adminList.module.css'
import formStyles from '../adminForm.module.css'
import tabStyles from './productTabs.module.css'

interface ProductSpecsTabProps {
  productId: number
  categoryId: number
}

interface SpecGroup {
  groupLabel: string
  definitions: SpecificationDefinitionResponse[]
}

// Thông số kỹ thuật là bulk-replace toàn bộ (ProductSpecValuesUpsertRequest)
// — bỏ trống 1 ô nghĩa là XOÁ giá trị đó khỏi sản phẩm khi lưu, không phải
// "giữ nguyên giá trị cũ".
function ProductSpecsTab({ productId, categoryId }: ProductSpecsTabProps) {
  const [definitions, setDefinitions] = useState<SpecificationDefinitionResponse[]>([])
  const [values, setValues] = useState<Record<number, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    setError(null)
    Promise.all([listSpecificationDefinitions(categoryId), listSpecificationValues(productId)])
      .then(([defs, currentValues]) => {
        setDefinitions([...defs].sort((a, b) => a.displayOrder - b.displayOrder))
        const initial: Record<number, string> = {}
        for (const value of currentValues) {
          initial[value.specificationDefinitionId] = value.value
        }
        setValues(initial)
      })
      .catch((err: unknown) => setError(getApiErrorMessage(err)))
      .finally(() => setIsLoading(false))
  }, [productId, categoryId])

  const groups: SpecGroup[] = []
  for (const definition of definitions) {
    const lastGroup = groups[groups.length - 1]
    if (lastGroup && lastGroup.groupLabel === definition.groupLabel) {
      lastGroup.definitions.push(definition)
    } else {
      groups.push({ groupLabel: definition.groupLabel, definitions: [definition] })
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSuccess(false)
    setIsSaving(true)
    try {
      const payloadValues = Object.entries(values)
        .filter(([, value]) => value.trim() !== '')
        .map(([specificationDefinitionId, value]) => ({
          specificationDefinitionId: Number(specificationDefinitionId),
          value: value.trim(),
        }))
      await upsertSpecifications(productId, { values: payloadValues })
      setSuccess(true)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể lưu thông số kỹ thuật'))
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <p>Đang tải...</p>
  }

  if (definitions.length === 0) {
    return (
      <div className={listStyles.emptyState}>
        <p>Danh mục này chưa có thông số kỹ thuật nào được định nghĩa.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      {groups.map((group) => (
        <div key={group.groupLabel} className={tabStyles.specGroup}>
          <p className={tabStyles.specGroupTitle}>{group.groupLabel}</p>
          {group.definitions.map((definition) => (
            <div key={definition.id} className={tabStyles.specRow}>
              <span className={tabStyles.specLabel}>
                {definition.label}
                {definition.unit && <span className={tabStyles.specUnit}> ({definition.unit})</span>}
              </span>
              <input
                type="text"
                value={values[definition.id] ?? ''}
                onChange={(event) => setValues((prev) => ({ ...prev, [definition.id]: event.target.value }))}
                placeholder="Bỏ trống để không hiển thị thông số này"
              />
            </div>
          ))}
        </div>
      ))}

      {error && <p className={formStyles.error}>{error}</p>}
      {success && <p className={formStyles.success}>Đã lưu thông số kỹ thuật.</p>}

      <div className={formStyles.actionsRow} style={{ marginTop: '1rem' }}>
        <button type="submit" className={formStyles.submitButton} disabled={isSaving}>
          {isSaving ? 'Đang lưu...' : 'Lưu thông số kỹ thuật'}
        </button>
      </div>
    </form>
  )
}

export default ProductSpecsTab
