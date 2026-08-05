import {
  useEffect,
  useId,
  useRef,
  type FormEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import styles from './AdminActionDialog.module.css'

export type AdminActionDialogTone = 'primary' | 'danger'

interface AdminActionDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  isSubmitting?: boolean
  error?: string | null
  tone?: AdminActionDialogTone
  children?: ReactNode
  onClose: () => void
  onConfirm: () => void | Promise<void>
}

function AdminActionDialog({
  open,
  title,
  description,
  confirmLabel,
  isSubmitting = false,
  error,
  tone = 'primary',
  children,
  onClose,
  onConfirm,
}: AdminActionDialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const cancelButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    const previousActiveElement = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusTimer = window.setTimeout(() => {
      // Tập trung vào nút an toàn thay vì nút gây thay đổi dữ liệu.
      cancelButtonRef.current?.focus()
    }, 0)

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      previousActiveElement?.focus()
    }
  }, [isSubmitting, onClose, open])

  if (!open) return null

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isSubmitting) void onConfirm()
  }

  return createPortal(
    <div
      className={styles.backdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onClose()
      }}
    >
      <form
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-busy={isSubmitting}
        onSubmit={handleSubmit}
      >
        <div className={styles.header}>
          <span className={tone === 'danger' ? styles.dangerMark : styles.primaryMark}>
            {tone === 'danger' ? '!' : '✓'}
          </span>
          <div>
            <p className={styles.eyebrow}>Xác nhận thao tác</p>
            <h2 id={titleId}>{title}</h2>
          </div>
        </div>

        <p id={descriptionId} className={styles.description}>
          {description}
        </p>

        {children && <div className={styles.content}>{children}</div>}

        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}

        <div className={styles.footer}>
          <button
            ref={cancelButtonRef}
            type="button"
            className={styles.cancelButton}
            disabled={isSubmitting}
            onClick={onClose}
          >
            Quay lại
          </button>
          <button
            type="submit"
            className={tone === 'danger' ? styles.dangerButton : styles.primaryButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Đang xử lý…' : confirmLabel}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  )
}

export default AdminActionDialog
