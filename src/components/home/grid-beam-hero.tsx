// Lucian UX/UI Prompt #226 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#226
"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import "./grid-beam-hero.css";

/** Grid cell in px; beams run on the grid lines. */
const C = 34;
const COL = ["129,140,248", "45,212,191", "244,114,182"];
type Beam = {
  v: boolean;
  l: number;
  p: number;
  d: 1 | -1;
  sp: number;
  len: number;
  c: string;
};

/**
 * Home hero: faint grid, beams gliding along grid lines on a canvas, and a
 * pointer-following highlight. With reduced motion only the grid and copy
 * are shown. Animation pauses while the hero is off screen.
 */
export function GridBeamHero() {
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = root.current,
      cv = canvas.current,
      cx = cv?.getContext("2d");
    if (!el || !cv || !cx) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let W = 0,
      H = 0,
      B: Beam[] = [],
      acc = 0,
      raf = 0,
      last = 0,
      vis = true,
      rm = media.matches;
    const spawn = () => {
      const v = Math.random() < 0.5,
        line = (1 + Math.floor(Math.random() * ((v ? W : H) / C - 1))) * C - 1,
        dir = Math.random() < 0.5 ? 1 : -1;
      B.push({
        v,
        l: line,
        p: dir > 0 ? -60 : (v ? H : W) + 60,
        d: dir,
        sp: 110 + Math.random() * 90,
        len: 50 + Math.random() * 40,
        c: COL[Math.floor(Math.random() * 3)],
      });
    };
    const draw = () => {
      cx.clearRect(0, 0, W, H);
      if (rm) return;
      for (const b of B) {
        const x0 = b.v ? b.l : b.p - b.d * b.len,
          y0 = b.v ? b.p - b.d * b.len : b.l,
          x1 = b.v ? b.l : b.p,
          y1 = b.v ? b.p : b.l;
        const g = cx.createLinearGradient(x0, y0, x1, y1);
        g.addColorStop(0, `rgba(${b.c},0)`);
        g.addColorStop(1, `rgba(${b.c},.95)`);
        cx.strokeStyle = g;
        cx.lineWidth = 1.6;
        cx.beginPath();
        cx.moveTo(x0 + 0.5, y0 + 0.5);
        cx.lineTo(x1 + 0.5, y1 + 0.5);
        cx.stroke();
        cx.fillStyle = `rgba(${b.c},1)`;
        cx.shadowColor = `rgba(${b.c},1)`;
        cx.shadowBlur = 8;
        cx.beginPath();
        cx.arc(x1 + 0.5, y1 + 0.5, 1.8, 0, 6.2832);
        cx.fill();
        cx.shadowBlur = 0;
      }
    };
    const frame = (now: number) => {
      raf = 0;
      if (!vis || rm) return;
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      acc += dt;
      if (acc > 0.42 && B.length < 9) {
        acc = 0;
        spawn();
      }
      for (const b of B) b.p += b.d * b.sp * dt;
      B = B.filter((b) => {
        const lim = (b.v ? H : W) + 70;
        return b.d > 0 ? b.p < lim : b.p > -70;
      });
      draw();
      raf = requestAnimationFrame(frame);
    };
    const run = () => {
      if (!raf && vis && !rm) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    // The hero is fluid: size the canvas to it and keep beams on grid lines.
    const resize = () => {
      const r = el.getBoundingClientRect(),
        dpr = Math.min(2, window.devicePixelRatio || 1);
      W = Math.round(r.width);
      H = Math.round(r.height);
      cv.width = W * dpr;
      cv.height = H * dpr;
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      B = B.filter((b) => b.l < (b.v ? W : H));
      draw();
    };
    resize();
    for (let i = 0; i < 4; i++) {
      spawn();
      B[i].p = (B[i].v ? H : W) * (0.2 + i * 0.18);
    }
    draw();
    run();
    const sizes = new ResizeObserver(resize);
    sizes.observe(el);
    const seen =
      "IntersectionObserver" in window
        ? new IntersectionObserver((es) => {
            vis = es[0].isIntersecting;
            run();
          })
        : null;
    seen?.observe(el);
    const motion = () => {
      rm = media.matches;
      draw();
      run();
    };
    media.addEventListener("change", motion);
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${(e.clientX - r.left).toFixed(0)}px`);
      el.style.setProperty("--my", `${(e.clientY - r.top).toFixed(0)}px`);
    };
    const leave = () => {
      el.style.setProperty("--mx", "-200px");
      el.style.setProperty("--my", "-200px");
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      sizes.disconnect();
      seen?.disconnect();
      media.removeEventListener("change", motion);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <section
      ref={root}
      id="overview"
      aria-labelledby="intro-title"
      className="u226"
    >
      <div className="u226-gd" aria-hidden="true" />
      <div className="u226-gl" aria-hidden="true" />
      <canvas ref={canvas} className="u226-cv" aria-hidden="true" />
      <div className="u226-glow" aria-hidden="true" />
      <div className="u226-c">
        <small>MVP 3×3 — bản thử nghiệm</small>
        <p className="sr-only">Chào mừng đến với ShanBik</p>
        <h1 id="intro-title" className="text-display">
          Mỗi nước xoay,
          <br />
          một bước tiến.
        </h1>
        <p className="text-body-lg">
          Không gian học, mô phỏng và luyện tập Rubik dành cho bạn.
        </p>
        <p className="text-body">
          Tạo scramble, nhập màu và xem lời giải từng bước cho khối 3×3. Dữ liệu
          giữ trong phiên; bản thử nghiệm chưa có tài khoản hoặc quét camera.
        </p>
        <div className="u226-bt">
          <Link href="/practice">
            Khám phá khu vực luyện tập{" "}
            <span aria-hidden="true" className="ml-2">
              →
            </span>
          </Link>
          <Link href="/learn">Học cơ bản</Link>
        </div>
      </div>
    </section>
  );
}
