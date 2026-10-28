import type { Metadata } from "next";
import { pageMetadata } from "@/config/site";
import { PageIntro } from "@/components/layout/page-intro";
import { ResetPassword } from "@/features/account/reset-password";
export const metadata: Metadata = pageMetadata({
  title: "Đặt lại mật khẩu — ShanBik",
  description: "Đặt mật khẩu mới cho tài khoản ShanBik.",
  path: "/tai-khoan/dat-lai-mat-khau",
  noindex: true,
});
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
