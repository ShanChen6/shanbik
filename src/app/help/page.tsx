import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/layout/page-intro";

export const metadata: Metadata = {
  title: "Trợ giúp — ShanBik",
  description:
    "Thông tin về các tính năng đang xây dựng, tài khoản, giao diện và cách dùng ShanBik.",
};
const questions = [
  {
    question: "Tôi có thể làm gì ở thời điểm hiện tại?",
    answer:
      "Bạn có thể khám phá các trang giới thiệu, đọc kiến thức nhập môn và chọn giao diện sáng hoặc tối. Mô phỏng, xáo trộn và giải khối đang được phát triển.",
  },
  {
    question: "Tôi có cần tạo tài khoản không?",
    answer:
      "Hiện bạn không cần tài khoản để xem các trang này. Các công cụ luyện tập cơ bản cũng được định hướng sử dụng mà không cần đăng nhập.",
  },
  {
    question: "Tôi có cần bật camera để giải Rubik không?",
    answer:
      "Chưa có công cụ giải hoặc quét camera ở phiên bản hiện tại. Công cụ giải dự kiến sẽ nhận trạng thái nhập bằng tay; camera là một khả năng riêng được xem xét sau.",
  },
  {
    question: "Làm sao đổi giao diện?",
    answer:
      "Trên máy tính, dùng mục Giao diện ở đầu trang. Trên màn hình nhỏ, mở Menu rồi chọn Sáng, Tối hoặc Hệ thống. Lựa chọn được lưu trên trình duyệt của bạn nếu trình duyệt cho phép lưu trữ.",
  },
  {
    question: "Tôi có thể dùng bàn phím không?",
    answer:
      "Dùng Tab hoặc Shift+Tab để di chuyển giữa các liên kết và nút, Enter để mở liên kết, Escape để đóng menu. Liên kết Bỏ qua điều hướng ở đầu trang giúp đi thẳng đến nội dung.",
  },
];
export default function HelpPage() {
  return (
    <div className="site-container pb-16 sm:pb-24">
      <PageIntro
        eyebrow="Trợ giúp"
        title="Một chút hướng dẫn, trước khi bắt đầu."
        description="Tìm hiểu những gì đang có và cách khám phá ShanBik thoải mái hơn."
      />
      <section aria-labelledby="faq-title" className="content-width">
        <h2 id="faq-title" className="text-heading mb-6">
          Câu hỏi thường gặp
        </h2>
        <dl className="grid gap-4">
          {questions.map((item) => (
            <div
              key={item.question}
              className="rounded-panel border border-border bg-surface p-6"
            >
              <dt className="text-lg font-bold">{item.question}</dt>
              <dd className="text-body mt-3 text-muted">{item.answer}</dd>
            </div>
          ))}
        </dl>
        <Link href="/" className="ui-button ui-button--secondary mt-8">
          Về trang chủ
        </Link>
      </section>
    </div>
  );
}
