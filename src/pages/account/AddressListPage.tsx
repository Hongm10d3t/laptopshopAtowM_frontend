import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteAddress, listAddresses, setDefaultAddress } from '../../services/user/addressService'
import { getApiErrorMessage } from '../../utils/apiError'
import type { AddressResponse } from '../../types/user/address'
import styles from './AddressListPage.module.css'

function AddressListPage() {
  const [addresses, setAddresses] = useState<AddressResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  function loadAddresses() {
    setIsLoading(true)
    listAddresses()
      .then(setAddresses)
      .catch((err: unknown) => setError(getApiErrorMessage(err)))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    loadAddresses()
  }, [])

  async function handleDelete(id: number) {
    if (!window.confirm('Xoá địa chỉ này?')) {
      return
    }
    try {
      await deleteAddress(id)
      loadAddresses()
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  async function handleSetDefault(id: number) {
    try {
      await setDefaultAddress(id)
      loadAddresses()
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  return (
    <section>
      <div className={styles.header}>
        <h1>Sổ địa chỉ</h1>
        <Link to="/account/addresses/new" className={styles.addButton}>
          + Thêm địa chỉ
        </Link>
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {isLoading && <p>Đang tải...</p>}
      {!isLoading && addresses.length === 0 && <p>Bạn chưa có địa chỉ nào.</p>}

      <ul className={styles.list}>
        {addresses.map((address) => (
          <li key={address.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <strong>{address.recipientName}</strong>
              {address.isDefault && <span className={styles.defaultBadge}>Mặc định</span>}
            </div>
            <p>{address.phone}</p>
            <p>
              {address.streetAddress}, {address.ward}, {address.district}, {address.province}
            </p>
            <div className={styles.actions}>
              <Link to={`/account/addresses/${address.id}/edit`}>Sửa</Link>
              {!address.isDefault && (
                <button type="button" onClick={() => handleSetDefault(address.id)}>
                  Đặt làm mặc định
                </button>
              )}
              <button type="button" onClick={() => handleDelete(address.id)}>
                Xoá
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default AddressListPage
