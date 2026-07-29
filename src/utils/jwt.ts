// Giải mã phần payload (base64url) của JWT — CHỈ đọc claim để hiển thị UI,
// KHÔNG xác thực chữ ký (không có secret ở client, và không cần: server
// luôn tự verify lại mỗi request qua JwtAuthenticationFilter). Viết tay thay
// vì thêm thư viện jwt-decode vì chỉ cần 5 dòng, tránh thêm dependency không
// cần thiết.
export function decodeJwtPayload<T>(token: string): T {
  const payloadSegment = token.split('.')[1]
  if (!payloadSegment) {
    throw new Error('Token không đúng định dạng JWT')
  }
  const base64 = payloadSegment.replace(/-/g, '+').replace(/_/g, '/')
  const json = decodeURIComponent(
    atob(base64)
      .split('')
      .map((char) => '%' + char.charCodeAt(0).toString(16).padStart(2, '0'))
      .join(''),
  )
  return JSON.parse(json) as T
}
