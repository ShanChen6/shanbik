"use client";
import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  createSolveRepository,
  openSolveDatabase,
} from "@/features/timer/database";
import {
  createLocalAdapter,
  createSupabaseRemote,
} from "@/features/sync/adapters";
import { describeSyncError, describeValue } from "@/features/sync/describe";
import {
  choiceKey,
  createBaseStore,
  syncOnce,
  type Choice,
  type KindConflict,
  type SyncReport,
} from "@/features/sync/engine";
import { KIND_LABELS } from "@/features/sync/kinds";
import { loadSupabase } from "./supabase";
type State =
  | { phase: "idle" }
  | { phase: "running" }
  | { phase: "done"; report: SyncReport; at: number }
  | { phase: "error"; message: string };
function notifyTimerTabs() {
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel("shanbik-timer");
  channel.postMessage("changed");
  channel.close();
}
/**
 * Manual sync of solves, favorites and bookmarks. The first sync on a device
 * needs explicit consent; conflicts are listed for the user to resolve and
 * nothing is overwritten without a choice.
 */
export function SyncPanel({ userId }: { userId: string }) {
  const baseStore = useMemo(() => createBaseStore(window.localStorage), []);
  const [firstSync, setFirstSync] = useState(
    () => baseStore.read(userId) === null,
  );
  const [consent, setConsent] = useState(false),
    [state, setState] = useState<State>({ phase: "idle" }),
    [picks, setPicks] = useState<Map<string, Choice["pick"]>>(new Map()),
    statusRef = useRef<HTMLDivElement>(null);
  const conflicts: readonly KindConflict[] =
    state.phase === "done" ? state.report.conflicts : [];
  const run = async (withChoices: boolean) => {
    const choices = new Map<string, Choice>();
    if (withChoices)
      for (const c of conflicts) {
        const pick = picks.get(choiceKey(c.kind, c.key));
        if (pick)
          choices.set(choiceKey(c.kind, c.key), {
            pick,
            local: c.local,
            remote: c.remote,
          });
      }
    setState({ phase: "running" });
    try {
      const client = await loadSupabase();
      if (!client) throw Error("Account backend is not configured");
      const report = await syncOnce({
        userId,
        consent,
        choices,
        baseStore,
        remote: createSupabaseRemote(client, userId),
        local: createLocalAdapter({
          openSolves: async () =>
            createSolveRepository(await openSolveDatabase(window.indexedDB)),
          storage: window.localStorage,
          notify: notifyTimerTabs,
        }),
      });
      setPicks(new Map());
      setState({ phase: "done", report, at: Date.now() });
    } catch (e) {
      setState({ phase: "error", message: describeSyncError(e) });
    } finally {
      setFirstSync(baseStore.read(userId) === null);
      statusRef.current?.focus();
    }
  };
  const running = state.phase === "running";
  return (
    <section
      className="rounded-panel border border-border bg-surface p-5 sm:p-8"
      aria-labelledby="sync-title"
    >
      <h2 id="sync-title" className="text-xl font-semibold">
        Đồng bộ dữ liệu
      </h2>
      <p className="mt-2 text-muted">
        Đồng bộ lịch sử giải (3×3), công thức yêu thích và giải đấu đã lưu giữa
        thiết bị này và tài khoản. Tiến độ bài học, ghi chú và giao diện vẫn chỉ
        lưu trên thiết bị.
      </p>
      {firstSync && (
        <label className="mt-4 flex items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 size-5"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          <span>
            Tôi đồng ý gộp dữ liệu trên thiết bị này với tài khoản. Bản ghi chỉ
            có ở một bên sẽ được chép sang bên kia; bản ghi khác nhau ở hai bên
            sẽ được hỏi lại, không tự ghi đè.
          </span>
        </label>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        <Button
          onClick={() => run(false)}
          loading={running}
          disabled={firstSync && !consent}
        >
          Đồng bộ ngay
        </Button>
      </div>
      <div ref={statusRef} tabIndex={-1} className="mt-4 outline-none">
        {running && <p role="status">Đang đồng bộ…</p>}
        {state.phase === "error" && (
          <div role="alert" className="rounded-xl border border-danger p-4">
            <p className="font-semibold text-danger">Đồng bộ chưa xong</p>
            <p className="mt-1 text-sm">{state.message}</p>
            <Button
              className="mt-3"
              variant="secondary"
              onClick={() => run(false)}
            >
              Thử lại
            </Button>
          </div>
        )}
        {state.phase === "done" && (
          <p role="status">
            Đồng bộ lúc {new Date(state.at).toLocaleTimeString("vi-VN")}: nhận{" "}
            {state.report.pulled}, gửi {state.report.pushed} thay đổi
            {conflicts.length
              ? `, ${conflicts.length} mục cần bạn chọn.`
              : ", không có xung đột."}
          </p>
        )}
      </div>
      {conflicts.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold">Mục khác nhau ở hai nơi</h3>
          <p className="mt-1 text-sm text-muted">
            Chọn bản muốn giữ cho từng mục. Mục chưa chọn giữ nguyên ở cả hai
            nơi và được hỏi lại ở lần đồng bộ sau.
          </p>
          <ul className="mt-4 space-y-4">
            {conflicts.map((c) => {
              const key = choiceKey(c.kind, c.key),
                name = `conflict-${key}`;
              return (
                <li key={key} className="rounded-xl border border-border p-4">
                  <fieldset>
                    <legend className="font-semibold">
                      {KIND_LABELS[c.kind]}: {c.key}
                    </legend>
                    {(["local", "remote"] as const).map((side) => (
                      <label
                        key={side}
                        className="mt-2 flex min-h-11 items-center gap-3"
                      >
                        <input
                          type="radio"
                          name={name}
                          className="size-5"
                          checked={picks.get(key) === side}
                          onChange={() =>
                            setPicks((p) => new Map(p).set(key, side))
                          }
                        />
                        <span>
                          {side === "local"
                            ? "Giữ bản trên thiết bị"
                            : "Giữ bản trên tài khoản"}
                          :{" "}
                          <span className="text-muted">
                            {describeValue(c.kind, c.key, c[side])}
                          </span>
                        </span>
                      </label>
                    ))}
                  </fieldset>
                </li>
              );
            })}
          </ul>
          <Button
            className="mt-4"
            onClick={() => run(true)}
            loading={running}
            disabled={picks.size === 0}
          >
            Áp dụng lựa chọn ({picks.size})
          </Button>
        </div>
      )}
    </section>
  );
}
