// Khớp VerifyEmailRequest/ResendVerificationEmailRequest
// (backend/.../auth/dto/VerifyEmailRequest.java, ResendVerificationEmailRequest.java).
export interface VerifyEmailRequest {
  token: string
}

export interface ResendVerificationEmailRequest {
  email: string
}
