import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { getProfile, updateProfile } from '../../services/user/profileService'
import { getApiErrorMessage } from '../../utils/apiError'
import type { ProfileResponse } from '../../types/user/profile'
import styles from './accountForm.module.css'

function ProfilePage() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    getProfile()
      .then((data) => {
        setProfile(data)
        setFullName(data.fullName)
        setPhone(data.phone ?? '')
      })
      .catch((err: unknown) => setError(getApiErrorMessage(err)))
      .finally(() => setIsLoading(false))
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setIsSaving(true)
    try {
      const updated = await updateProfile({ fullName: fullName.trim(), phone: phone.trim() || undefined })
      setProfile(updated)
      setSuccessMessage('Cập nhật hồ sơ thành công')
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <p>Đang tải hồ sơ...</p>
  }
  if (!profile) {
    return <p className={styles.error}>{error ?? 'Không tải được hồ sơ'}</p>
  }

  return (
    <section>
      <h1>Thông tin tài khoản</h1>
      <dl className={styles.readonlyInfo}>
        <dt>Email</dt>
        <dd>{profile.email}</dd>
        <dt>Ngày tham gia</dt>
        <dd>{new Date(profile.createdAt).toLocaleDateString('vi-VN')}</dd>
      </dl>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          Họ tên
          <input
            type="text"
            value={fullName}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setFullName(event.target.value)}
            required
          />
        </label>
        <label className={styles.field}>
          Số điện thoại
          <input
            type="tel"
            value={phone}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setPhone(event.target.value)}
          />
        </label>

        {error && <p className={styles.error}>{error}</p>}
        {successMessage && <p className={styles.success}>{successMessage}</p>}

        <button type="submit" className={styles.submitButton} disabled={isSaving}>
          {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </form>
    </section>
  )
}

export default ProfilePage
