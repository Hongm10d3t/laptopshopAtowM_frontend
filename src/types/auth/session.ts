// Khớp UserRole (backend/.../user/entity/UserRole.java) — chỉ 2 giá trị.
export type UserRole = 'ADMIN' | 'CUSTOMER'

// Khớp ĐÚNG tên key thật trong JSON payload của JWT (AccessTokenService.java
// — sub/email/role/iss/iat/exp/jti, KHÔNG có fullName/phone). "sub" là
// string (JWT chuẩn chỉ cho phép subject dạng string) dù giá trị thật là số
// userId — phải tự parseInt khi dùng, xem utils/session.ts. Chỉ đọc để hiển
// thị UI, KHÔNG dùng để tự xác thực chữ ký — server luôn tự verify lại token
// ở mọi request qua JwtAuthenticationFilter.
export interface AccessTokenPayload {
  sub: string
  email: string
  role: UserRole
  jti: string
  exp: number
  iat: number
}
