import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  createAdminVoucher,
  getAdminVoucher,
  updateAdminVoucher,
} from '../../../services/voucher/adminVoucherService'
import type {
  VoucherCreateRequest,
  VoucherDiscountType,
  VoucherUpdateRequest,
} from '../../../types/voucher/adminVoucher'
import { getApiErrorMessage } from '../../../utils/apiError'
import { formatCurrency } from '../../../utils/currency'
import styles from './VoucherFormPage.module.css'

interface FormState {
  code: string
  description: string
  discountType: VoucherDiscountType
  discountValue: string
  maxDiscountAmount: string
  minOrderAmount: string
  usageLimit: string
  usageLimitPerUser: string
  startAt: string
  endAt: string
  active: boolean
}

function toDateTimeLocal(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function fromIsoToDateTimeLocal(isoString: string): string {
  return toDateTimeLocal(new Date(isoString))
}

function createInitialState(): FormState {
  const start = new Date()
  start.setSeconds(0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 7)

  return {
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    maxDiscountAmount: '',
    minOrderAmount: '0',
    usageLimit: '',
    usageLimitPerUser: '1',
    startAt: toDateTimeLocal(start),
    endAt: toDateTimeLocal(end),
    active: true,
  }
}

function parseRequiredNumber(value: string): number | null {
  if (!value.trim()) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function parseOptionalNumber(value: string): number | undefined {
  if (!value.trim()) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function parseOptionalInteger(value: string): number | undefined {
  const parsed = parseOptionalNumber(value)
  return parsed !== undefined && Number.isInteger(parsed) ? parsed : undefined
}

function VoucherFormPage() {
  const { id } = useParams<{ id: string }>()
  const voucherId = id ? Number(id) : undefined
  const isEditing = voucherId !== undefined
  const navigate = useNavigate()

  const [form, setForm] = useState<FormState>(createInitialState)
  const [isLoading, setIsLoading] = useState(isEditing)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (voucherId === undefined) return
    if (!Number.isInteger(voucherId) || voucherId <= 0) {
      setError('Mã voucher không hợp lệ')
      setIsLoading(false)
      return
    }

    let cancelled = false
    getAdminVoucher(voucherId)
      .then((voucher) => {
        if (cancelled) return
        setForm({
          code: voucher.code,
          description: voucher.description ?? '',
          discountType: voucher.discountType,
          discountValue: String(voucher.discountValue),
          maxDiscountAmount: voucher.maxDiscountAmount === null ? '' : String(voucher.maxDiscountAmount),
          minOrderAmount: String(voucher.minOrderAmount),
          usageLimit: voucher.usageLimit === null ? '' : String(voucher.usageLimit),
          usageLimitPerUser: voucher.usageLimitPerUser === null ? '' : String(voucher.usageLimitPerUser),
          startAt: fromIsoToDateTimeLocal(voucher.startAt),
          endAt: fromIsoToDateTimeLocal(voucher.endAt),
          active: voucher.active,
        })
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getApiErrorMessage(err, 'Không thể tải voucher'))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [voucherId])

  function handleTextChange(field: keyof FormState) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = field === 'code' ? event.target.value.toUpperCase() : event.target.value
      setForm((current) => ({ ...current, [field]: value }))
    }
  }

  function validate(): string | null {
    const code = form.code.trim()
    const discountValue = parseRequiredNumber(form.discountValue)
    const maxDiscountAmount = parseOptionalNumber(form.maxDiscountAmount)
    const minOrderAmount = parseRequiredNumber(form.minOrderAmount)
    const usageLimit = parseOptionalInteger(form.usageLimit)
    const usageLimitPerUser = parseOptionalInteger(form.usageLimitPerUser)
    const startAt = new Date(form.startAt)
    const endAt = new Date(form.endAt)

    if (!code) return 'Mã voucher không được để trống'
    if (code.length > 50) return 'Mã voucher tối đa 50 ký tự'
    if (discountValue === null || discountValue <= 0) return 'Giá trị giảm phải lớn hơn 0'
    if (form.discountType === 'PERCENTAGE' && discountValue > 100) return 'Mức giảm phần trăm không được vượt quá 100%'
    if (maxDiscountAmount !== undefined && maxDiscountAmount < 0) return 'Mức giảm tối đa không được âm'
    if (minOrderAmount === null || minOrderAmount < 0) return 'Giá trị đơn tối thiểu không được âm'
    if (form.usageLimit && (usageLimit === undefined || usageLimit <= 0)) return 'Tổng lượt sử dụng phải là số nguyên dương'
    if (form.usageLimitPerUser && (usageLimitPerUser === undefined || usageLimitPerUser <= 0)) {
      return 'Lượt sử dụng mỗi khách phải là số nguyên dương'
    }
    if (usageLimit !== undefined && usageLimitPerUser !== undefined && usageLimitPerUser > usageLimit) {
      return 'Lượt sử dụng mỗi khách không thể lớn hơn tổng lượt sử dụng'
    }
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) return 'Thời gian áp dụng không hợp lệ'
    if (endAt <= startAt) return 'Thời gian kết thúc phải sau thời gian bắt đầu'
    return null
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    const discountValue = Number(form.discountValue)
    const minOrderAmount = Number(form.minOrderAmount)
    const maxDiscountAmount = form.discountType === 'PERCENTAGE'
      ? parseOptionalNumber(form.maxDiscountAmount)
      : undefined
    const usageLimit = parseOptionalInteger(form.usageLimit)
    const usageLimitPerUser = parseOptionalInteger(form.usageLimitPerUser)

    const commonPayload = {
      description: form.description.trim() || undefined,
      discountType: form.discountType,
      discountValue,
      maxDiscountAmount,
      minOrderAmount,
      usageLimit,
      usageLimitPerUser,
      startAt: new Date(form.startAt).toISOString(),
      endAt: new Date(form.endAt).toISOString(),
    }

    setIsSaving(true)
    try {
      if (voucherId !== undefined) {
        const payload: VoucherUpdateRequest = { ...commonPayload, active: form.active }
        await updateAdminVoucher(voucherId, payload)
      } else {
        const payload: VoucherCreateRequest = { ...commonPayload, code: form.code.trim().toUpperCase() }
        await createAdminVoucher(payload)
      }
      navigate('/admin/vouchers')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể lưu voucher'))
    } finally {
      setIsSaving(false)
    }
  }

  const previewDiscount = useMemo(() => {
    const value = Number(form.discountValue)
    if (!Number.isFinite(value) || value <= 0) return '—'
    return form.discountType === 'PERCENTAGE' ? `${value}%` : formatCurrency(value)
  }, [form.discountType, form.discountValue])

  if (isLoading) return <div className={styles.loadingCard}>Đang tải thông tin voucher…</div>

  return (
    <section>
      <p className={styles.breadcrumb}>
        <Link to="/admin/vouchers">Voucher</Link>
        <span>/</span>
        <span>{isEditing ? 'Chỉnh sửa' : 'Tạo mới'}</span>
      </p>

      <div className={styles.header}>
        <p className={styles.eyebrow}>Khuyến mãi</p>
        <h1>{isEditing ? `Chỉnh sửa ${form.code}` : 'Tạo voucher mới'}</h1>
        <p className={styles.description}>
          Cấu hình mức giảm, điều kiện đơn hàng, giới hạn sử dụng và khoảng thời gian có hiệu lực.
        </p>
      </div>

      <div className={styles.layout}>
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Thông tin cơ bản</h2>
              <p>Mã voucher nên ngắn, dễ đọc và không chứa thông tin nhạy cảm.</p>
            </div>
            <div className={styles.gridTwo}>
              <label className={styles.field}>
                <span className={styles.labelRow}>Mã voucher</span>
                <input
                  value={form.code}
                  onChange={handleTextChange('code')}
                  maxLength={50}
                  placeholder="SALE10"
                  disabled={isEditing}
                  required
                />
                {isEditing && <p className={styles.hint}>Backend không cho phép đổi mã sau khi tạo.</p>}
              </label>
              <label className={styles.field}>
                <span className={styles.labelRow}>Loại giảm giá</span>
                <select
                  value={form.discountType}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      discountType: event.target.value as VoucherDiscountType,
                      maxDiscountAmount: event.target.value === 'FIXED_AMOUNT' ? '' : current.maxDiscountAmount,
                    }))
                  }
                >
                  <option value="PERCENTAGE">Theo phần trăm</option>
                  <option value="FIXED_AMOUNT">Số tiền cố định</option>
                </select>
              </label>
              <label className={styles.fullField}>
                <span className={styles.labelRow}>
                  Mô tả <span className={styles.optional}>Không bắt buộc</span>
                </span>
                <textarea
                  value={form.description}
                  onChange={handleTextChange('description')}
                  maxLength={255}
                  placeholder="Ví dụ: Giảm giá chào hè cho đơn laptop từ 20 triệu"
                />
                <p className={styles.hint}>{form.description.length}/255 ký tự</p>
              </label>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Mức giảm và điều kiện</h2>
              <p>Giá trị tiền tệ sử dụng đơn vị VNĐ như toàn bộ hệ thống.</p>
            </div>
            <div className={styles.gridTwo}>
              <label className={styles.field}>
                <span className={styles.labelRow}>
                  {form.discountType === 'PERCENTAGE' ? 'Phần trăm giảm' : 'Số tiền giảm'}
                </span>
                <input
                  type="number"
                  value={form.discountValue}
                  onChange={handleTextChange('discountValue')}
                  min="0"
                  max={form.discountType === 'PERCENTAGE' ? '100' : undefined}
                  step={form.discountType === 'PERCENTAGE' ? '0.01' : '1000'}
                  placeholder={form.discountType === 'PERCENTAGE' ? '10' : '500000'}
                  required
                />
              </label>
              {form.discountType === 'PERCENTAGE' ? (
                <label className={styles.field}>
                  <span className={styles.labelRow}>
                    Mức giảm tối đa <span className={styles.optional}>Không bắt buộc</span>
                  </span>
                  <input
                    type="number"
                    value={form.maxDiscountAmount}
                    onChange={handleTextChange('maxDiscountAmount')}
                    min="0"
                    step="1000"
                    placeholder="Không giới hạn"
                  />
                </label>
              ) : (
                <div className={styles.field}>
                  <span className={styles.labelRow}>Cách tính</span>
                  <p className={styles.hint}>Voucher cố định giảm trực tiếp số tiền đã nhập, tối đa bằng giá trị đơn.</p>
                </div>
              )}
              <label className={styles.field}>
                <span className={styles.labelRow}>Giá trị đơn tối thiểu</span>
                <input
                  type="number"
                  value={form.minOrderAmount}
                  onChange={handleTextChange('minOrderAmount')}
                  min="0"
                  step="1000"
                  required
                />
              </label>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Giới hạn sử dụng</h2>
              <p>Để trống nếu không muốn giới hạn tổng lượt hoặc lượt của từng khách.</p>
            </div>
            <div className={styles.gridTwo}>
              <label className={styles.field}>
                <span className={styles.labelRow}>
                  Tổng lượt sử dụng <span className={styles.optional}>Không bắt buộc</span>
                </span>
                <input
                  type="number"
                  value={form.usageLimit}
                  onChange={handleTextChange('usageLimit')}
                  min="1"
                  step="1"
                  placeholder="Không giới hạn"
                />
              </label>
              <label className={styles.field}>
                <span className={styles.labelRow}>
                  Lượt mỗi khách <span className={styles.optional}>Không bắt buộc</span>
                </span>
                <input
                  type="number"
                  value={form.usageLimitPerUser}
                  onChange={handleTextChange('usageLimitPerUser')}
                  min="1"
                  step="1"
                  placeholder="Không giới hạn"
                />
              </label>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Thời gian hiệu lực</h2>
              <p>Thời gian được nhập theo múi giờ trên thiết bị và gửi về backend ở định dạng UTC.</p>
            </div>
            <div className={styles.gridTwo}>
              <label className={styles.field}>
                <span className={styles.labelRow}>Bắt đầu</span>
                <input type="datetime-local" value={form.startAt} onChange={handleTextChange('startAt')} required />
              </label>
              <label className={styles.field}>
                <span className={styles.labelRow}>Kết thúc</span>
                <input type="datetime-local" value={form.endAt} onChange={handleTextChange('endAt')} required />
              </label>
              {isEditing && (
                <label className={`${styles.checkboxRow} ${styles.fullField}`}>
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))}
                  />
                  <span className={styles.checkboxText}>
                    <strong>Cho phép sử dụng voucher</strong>
                    <span>Tắt mục này để vô hiệu hóa ngay, kể cả khi voucher còn thời gian và lượt sử dụng.</span>
                  </span>
                </label>
              )}
            </div>
          </div>

          {error && <p className={styles.error} role="alert">{error}</p>}

          <div className={styles.actions}>
            <button type="submit" className={styles.submitButton} disabled={isSaving}>
              {isSaving ? 'Đang lưu…' : isEditing ? 'Lưu thay đổi' : 'Tạo voucher'}
            </button>
            <button
              type="button"
              className={styles.cancelButton}
              disabled={isSaving}
              onClick={() => navigate('/admin/vouchers')}
            >
              Hủy
            </button>
          </div>
        </form>

        <aside className={styles.previewCard} aria-label="Xem trước voucher">
          <div className={styles.previewTop}>
            <p className={styles.previewLabel}>Xem trước</p>
            <h2 className={styles.previewCode}>{form.code.trim() || 'MÃ VOUCHER'}</h2>
            <p className={styles.previewDiscount}>{previewDiscount}</p>
          </div>
          <div className={styles.previewBody}>
            <p className={styles.previewDescription}>
              {form.description.trim() || 'Mô tả voucher sẽ hiển thị tại đây.'}
            </p>
            <div className={styles.previewLine}>
              <span>Đơn tối thiểu</span>
              <strong>{formatCurrency(Number(form.minOrderAmount) || 0)}</strong>
            </div>
            <div className={styles.previewLine}>
              <span>Giới hạn</span>
              <strong>{form.usageLimit.trim() || 'Không giới hạn'} lượt</strong>
            </div>
            <div className={styles.previewLine}>
              <span>Mỗi khách</span>
              <strong>{form.usageLimitPerUser.trim() || 'Không giới hạn'}</strong>
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}

export default VoucherFormPage
