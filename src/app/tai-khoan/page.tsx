import type { Metadata } from "next";
import { pageMetadata } from "@/config/site";
import { PageIntro } from "@/components/layout/page-intro";
import { AccountPanel } from "@/features/account/account-panel";
export const metadata: Metadata = pageMetadata({
  title: "Tài khoản — ShanBik",
  description:
    "Đăng nhập để đồng bộ lịch sử giải, công thức yêu thích và giải đấu đã lưu giữa các thiết bị. Không bắt buộc: chế độ khách vẫn dùng được mọi công cụ.",
  path: "/tai-khoan",
  noindex: true,
});
export default function AccountPage() {
  return (
    <div className="site-container pb-16 sm:pb-24">
      <PageIntro
        eyebrow="Tài khoản"
        title="Dữ liệu của bạn, trên mọi thiết bị."
        description="Tài khoản là tuỳ chọn. Khi đăng nhập, bạn chủ động đồng bộ; thay đổi khác nhau ở hai nơi luôn được hỏi lại trước khi ghi."
      />
      <div className="max-w-content">
        <AccountPanel />
      </div>
    </div>
  );
}
