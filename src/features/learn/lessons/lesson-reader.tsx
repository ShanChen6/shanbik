"use client";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { Lesson } from "./schema";
import { lessonStep, stepHref } from "./navigation";
import { createLessonProgress } from "./progress";
import { LessonStepViewer } from "./step-viewer";
import { StateDiagram } from "./state-diagram";
export function LessonReader({ lesson }: { lesson: Lesson }) {
  const params = useSearchParams(),
    router = useRouter();
  const [progress] = useState(() =>
    createLessonProgress(lesson, () => window.localStorage),
  );
  const saved = useSyncExternalStore(
    progress.subscribe,
    progress.getSnapshot,
    progress.getServerSnapshot,
  );
  useEffect(() => {
    progress.open();
    return progress.close;
  }, [progress]);
  const requested = params.get("step");
  const { index, invalid } = lessonStep(
    lesson,
    requested === null ? saved.stepId : requested,
  );
  const step = lesson.steps[index];
  const previous = useRef<string | null>(null),
    heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (previous.current !== step.id) {
      const navigation = previous.current !== null;
      previous.current = step.id;
      if (navigation || window.location.hash === "#lesson-step") {
        heading.current?.focus({ preventScroll: true });
        heading.current?.scrollIntoView({ block: "start" });
      }
    }
  }, [step.id]);
  useEffect(() => {
    if (saved.loaded && !invalid) progress.select(step.id);
  }, [progress, saved.loaded, invalid, step.id]);
  return (
    <section aria-label="Bài học từng bước" className="space-y-6">
      <div className="grid items-start gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <nav
          aria-label="Các bước bài học"
          className="space-y-4 rounded-panel border border-border bg-surface p-5"
        >
          <label className="flex flex-col gap-2 text-sm font-semibold">
            Chọn bước học
            <select
              aria-label="Chọn bước học"
              className="ui-input"
              value={step.id}
              onChange={(event) =>
                router.push(
                  stepHref(
                    lesson,
                    lesson.steps.findIndex(
                      (item) => item.id === event.target.value,
                    ),
                  ),
                  { scroll: false },
                )
              }
            >
              {lesson.steps.map((item, i) => (
                <option key={item.id} value={item.id}>
                  {i + 1}. {item.title}
                </option>
              ))}
            </select>
          </label>
          <p
            role="status"
            aria-label="Vị trí học đã lưu"
            className="text-xs text-muted"
          >
            {!saved.loaded
              ? "Đang đọc vị trí đã lưu…"
              : saved.status === "unavailable"
                ? "Không truy cập được bộ nhớ local. Vị trí hiện tại chỉ giữ trong phiên này."
                : saved.status === "saved"
                  ? "Đã lưu vị trí đang đọc trên trình duyệt này."
                  : saved.status === "cleared"
                    ? "Đã xóa vị trí lưu của bài này."
                    : "Vị trí sẽ tự lưu khi bạn đổi bước."}
            {saved.invalid ? " Đã bỏ qua dữ liệu lưu không hợp lệ." : ""}
          </p>
          <Button
            variant="secondary"
            disabled={!saved.loaded}
            onClick={() => {
              progress.clear();
              router.replace(stepHref(lesson, 0), { scroll: false });
            }}
          >
            Xóa vị trí đã lưu
          </Button>
          <ol className="hidden space-y-2 lg:block">
            {lesson.steps.map((item, i) => (
              <li key={item.id}>
                <Link
                  href={stepHref(lesson, i)}
                  scroll={false}
                  aria-current={i === index ? "step" : undefined}
                  className={`flex min-h-11 items-center rounded-lg border p-3 text-sm ${i === index ? "border-primary bg-surface-subtle font-bold text-primary" : "border-border text-muted"}`}
                >
                  {i + 1}. {item.title}
                </Link>
              </li>
            ))}
          </ol>
        </nav>
        <div className="min-w-0 space-y-5 rounded-panel border border-border bg-surface p-5 sm:p-8">
          <p role="status" className="text-sm font-semibold text-primary">
            Bước {index + 1}/{lesson.steps.length} ·{" "}
            {step.kind === "observe" ? "Quan sát" : "Thực hiện nước xoay"}
          </p>
          {invalid && (
            <p role="status" className="text-sm text-warning">
              Liên kết bước chưa hợp lệ. Đang hiển thị bước đầu của bài.
            </p>
          )}
          <h2
            id="lesson-step"
            ref={heading}
            tabIndex={-1}
            className="text-heading scroll-mt-4"
          >
            {step.title}
          </h2>
          <ol
            aria-label="Hướng dẫn bước hiện tại"
            className="list-decimal space-y-3 pl-5 text-muted"
          >
            {step.instructions.map((text, i) => (
              <li key={i}>{text}</li>
            ))}
          </ol>
          <div
            aria-label="Mục tiêu của bước"
            role="group"
            className="rounded-xl bg-surface-subtle p-4"
          >
            <h3 className="font-semibold">Mục tiêu của bước</h3>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-muted">
              {step.objectiveIds.map((id) => (
                <li key={id}>
                  {
                    lesson.objectives.find((goal) => goal.id === id)!
                      .description
                  }
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">Thuật toán</h3>
            {step.kind === "observe" ? (
              <p className="mt-2 text-sm text-muted">
                Chỉ quan sát, không có nước xoay trong bước này.
              </p>
            ) : (
              <p
                aria-label="Thuật toán bước hiện tại"
                className="mt-2 break-words rounded-lg border border-border bg-surface-subtle p-4 font-mono text-xl [overflow-wrap:anywhere]"
              >
                {step.algorithm}
              </p>
            )}
          </div>
          {saved.loaded ? (
            <LessonStepViewer
              key={`${lesson.id}:${lesson.contentVersion}:${step.id}`}
              step={step}
            />
          ) : (
            <p role="status">Đang chuẩn bị minh họa theo vị trí học…</p>
          )}
          <div>
            <h3 className="mb-3 font-semibold">Trạng thái đã kiểm chứng</h3>
            <p className="mb-3 text-sm text-muted">
              Giữ tâm trắng U trên, xanh lá F trước. Mỗi mặt nhìn từ bên ngoài,
              đọc theo hàng. Tr: Trắng · Đ: Đỏ · XL: Xanh lá · V: Vàng · C: Cam
              · XD: Xanh dương.
            </p>
            <div className="grid gap-4 xl:grid-cols-2">
              <StateDiagram state={step.before} label="Trạng thái trước" />
              <StateDiagram state={step.after} label="Trạng thái sau" />
            </div>
          </div>
          <nav aria-label="Chuyển bước" className="flex flex-wrap gap-3">
            {index > 0 ? (
              <Link
                className="ui-button ui-button--secondary"
                scroll={false}
                href={stepHref(lesson, index - 1)}
              >
                Bước trước
              </Link>
            ) : (
              <Button variant="secondary" disabled>
                Bước trước
              </Button>
            )}
            {index < lesson.steps.length - 1 ? (
              <Link
                className="ui-button ui-button--primary"
                scroll={false}
                href={stepHref(lesson, index + 1)}
              >
                Bước tiếp
              </Link>
            ) : (
              <Button disabled>Bước tiếp</Button>
            )}
            <Link
              className="ui-button ui-button--ghost"
              scroll={false}
              href={stepHref(lesson, 0)}
            >
              Về đầu bài
            </Link>
          </nav>
          {index === lesson.steps.length - 1 && (
            <p role="status" className="text-sm text-success">
              Đây là bước cuối. Bạn có thể về đầu bài để xem lại U rồi U′.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
