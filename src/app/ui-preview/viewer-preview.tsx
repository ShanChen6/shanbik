"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PracticeCube } from "@/features/cube/viewer/practice-cube";

/** Development fixture: real removal, unlike a route retained by Next Activity. */
export function ViewerPreview() {
  const [visible, setVisible] = useState(false);
  return (
    <section
      aria-labelledby="viewer-preview-title"
      className="max-w-3xl space-y-4"
    >
      <h2 id="viewer-preview-title" className="text-heading">
        Kiểm tra vòng đời viewer
      </h2>
      <Button onClick={() => setVisible((current) => !current)}>
        {visible ? "Ẩn mô hình thử" : "Hiện mô hình thử"}
      </Button>
      {visible && <PracticeCube />}
    </section>
  );
}
