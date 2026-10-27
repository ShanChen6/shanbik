"use client";
import dynamic from "next/dynamic";
import { LoadingState } from "@/components/ui/states";
import type { PuzzleId } from "./registry";
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
  return <Workbench {...props} />;
}
