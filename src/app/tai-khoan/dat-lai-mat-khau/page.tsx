import type { Metadata } from "next";
import { PageIntro } from "@/components/layout/page-intro";
import { ResetPassword } from "@/features/account/reset-password";
export const metadata: Metadata = {
  title: "Đặt lại mật khẩu — ShanBik",
  description: "Đặt mật khẩu mới cho tài khoản ShanBik.",
  robots: { index: false },
};
export default function ResetPasswordPage() {
  return (
    <div className="site-container pb-16 sm:pb-24">
      <PageIntro
        eyebrow="Tài khoản"
        title="Đặt lại mật khẩu."
        description="Nhập mật khẩu mới. Liên kết trong thư chỉ dùng được một lần."
      />
      <div className="content-width">
        <ResetPassword />
      </div>
    </div>
  );
}
