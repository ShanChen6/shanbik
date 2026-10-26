import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UIPreview } from "./preview";

export const metadata: Metadata = {
  title: "UI preview — ShanBik",
  robots: { index: false, follow: false },
};
export default function PreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <UIPreview />;
}
