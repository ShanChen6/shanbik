/** Form validation and Vietnamese messages for Supabase Auth errors. */
export const MIN_PASSWORD = 8;
export type AuthErrors = Partial<Record<"email" | "password", string>>;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function validateCredentials(
  email: string | null,
  password: string | null,
): AuthErrors {
  const errors: AuthErrors = {};
  if (email !== null && (!EMAIL.test(email.trim()) || email.length > 254))
    errors.email = "Nhập email hợp lệ, ví dụ ban@example.com.";
  if (password !== null) {
    if (password.length < MIN_PASSWORD)
      errors.password = `Mật khẩu cần ít nhất ${MIN_PASSWORD} ký tự.`;
    else if (password.length > 72)
      errors.password = "Mật khẩu tối đa 72 ký tự.";
  }
  return errors;
}
/** Maps an auth error to a message that does not reveal whether an email exists. */
export function authMessage(error: unknown): string {
  const e = error as { code?: string; status?: number; message?: string };
  const code = e?.code ?? "";
  if (code === "invalid_credentials") return "Email hoặc mật khẩu không đúng.";
  if (code === "email_not_confirmed")
    return "Email chưa được xác nhận. Mở thư xác nhận trong hộp thư rồi đăng nhập lại.";
  if (code === "weak_password")
    return "Mật khẩu quá yếu. Hãy dùng mật khẩu dài hơn, khó đoán hơn.";
  if (code === "same_password") return "Mật khẩu mới phải khác mật khẩu cũ.";
  if (
    code === "over_request_rate_limit" ||
    code === "over_email_send_rate_limit" ||
    e?.status === 429
  )
    return "Thao tác quá nhiều lần. Đợi vài phút rồi thử lại.";
  if (code === "signup_disabled") return "Hiện chưa mở đăng ký tài khoản mới.";
  if (code === "session_not_found" || code === "refresh_token_not_found")
    return "Phiên đăng nhập đã hết hạn. Đăng nhập lại.";
  if (
    e?.message === "Failed to fetch" ||
    e?.status === 0 ||
    error instanceof TypeError
  )
    return "Không kết nối được máy chủ tài khoản. Kiểm tra mạng rồi thử lại.";
  return "Có lỗi khi xử lý tài khoản. Thử lại sau ít phút.";
}
