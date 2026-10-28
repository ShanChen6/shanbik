import type { Metadata } from "next";
import { pageMetadata } from "@/config/site";
import { PageIntro } from "@/components/layout/page-intro";
import { TimerPanel } from "@/features/timer/timer-panel";
import { LearningPath } from "@/features/puzzles/learning-path";
export const metadata: Metadata = pageMetadata({
  title: "Timer 3×3 — ShanBik",
  description:
    "Bấm giờ luyện Rubik 3×3 bằng Space hoặc touch, quan sát tùy chọn và lưu lượt giải trong trình duyệt.",
  path: "/timer",
});
export default function TimerPage() {
  return (
    <div className="site-container pb-16 sm:pb-24">
      <PageIntro
        eyebrow="Timer 3×3"
        title="Tập trung vào một lượt giải."
        description="Chuẩn bị khối thật theo scramble, chọn quan sát nếu muốn, rồi giữ và thả vùng timer để bắt đầu. Không cần WebGL."
      />
      <TimerPanel />
      <div className="mt-8">
        <LearningPath puzzle="3x3" current="timer" />
      </div>
    </div>
  );
}
