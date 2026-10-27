"use client";
import dynamic from "next/dynamic";
import { LoadingState } from "@/components/ui/states";
import { capabilitiesOf, type PuzzleId } from "./registry";
/**
 * Keeps the workbench (models, Worker client, viewers) out of the shared
 * /puzzles/[slug] bundle: pages without practice tools, like 3×3, do not
 * download or hydrate it, and the catalog back link hydrates sooner.
 */
const Workbench = dynamic(
  () => import("./workbench").then((module) => module.PuzzleWorkbench),
  {
    ssr: false,
    loading: () => <LoadingState label="Đang tải công cụ thực hành…" />,
  },
);
export function PuzzleWorkbenchLoader(props: { slug: PuzzleId; name: string }) {
  return (
    <section
      aria-labelledby="workbench-title"
      className="min-w-0 space-y-4 rounded-panel border border-border bg-surface p-5 sm:p-8"
    >
      <h2 id="workbench-title" className="text-heading">
        Thực hành
      </h2>
      <p className="text-sm text-muted">
        Chỉ gồm các công cụ ShanBik đã có cho {props.name}
        {capabilitiesOf(props.slug).solve ? "" : "; chưa có tìm lời giải"}.
      </p>
      <Workbench {...props} />
    </section>
  );
}
