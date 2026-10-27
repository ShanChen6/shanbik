"use client";
import { useMounted, useNow } from "./clock";
import { StatusBadge } from "./explorer";
import { formatInstant, viewerZone } from "./format";
import { registrationAt, type Competition } from "./schema";
const REGISTRATION = {
  "not-open": "Chưa mở đăng ký",
  open: "Đang mở đăng ký",
  closed: "Đã đóng đăng ký",
} as const;
export function LiveStatus({ competition }: { competition: Competition }) {
  const now = useNow(),
    reg = now === null ? null : registrationAt(competition, now);
  return (
    <p
      role="status"
      aria-label="Trạng thái giải"
      className="flex flex-wrap items-center gap-2"
    >
      <StatusBadge competition={competition} now={now} />
      {reg && <span className="text-sm text-muted">{REGISTRATION[reg]}</span>}
    </p>
  );
}
/** The viewer's own clock, rendered after hydration only. */
export function ViewerTime({ ms }: { ms: number }) {
  return useMounted() ? <>{formatInstant(ms)}</> : <>—</>;
}
export function ViewerZone() {
  return useMounted() ? <>{viewerZone()}</> : <>múi giờ của bạn</>;
}
