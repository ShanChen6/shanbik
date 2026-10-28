"use client";
import type { Session } from "@supabase/supabase-js";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/states";
import { SyncPanel } from "./sync-panel";
import { authMessage, validateCredentials, type AuthErrors } from "./auth";
import { loadSupabase, supabaseConfig } from "./supabase";
type Mode = "sign-in" | "sign-up" | "recover";
const MODES: Record<Mode, string> = {
  "sign-in": "Đăng nhập",
  "sign-up": "Đăng ký",
  recover: "Quên mật khẩu",
};
const panel = "rounded-panel border border-border bg-surface p-5 sm:p-8";
/** Tracks the Supabase session; `undefined` while it is being restored. */
export function useSession(): Session | null | undefined {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    let live = true,
      unsubscribe = () => {};
    loadSupabase()
      .then(async (client) => {
        if (!client || !live) return;
        const { data } = client.auth.onAuthStateChange(
          (_event, next) => live && setSession(next),
        );
        unsubscribe = () => data.subscription.unsubscribe();
        const { data: current } = await client.auth.getSession();
        if (live) setSession(current.session);
      })
      .catch(() => live && setSession(null));
    return () => {
      live = false;
      unsubscribe();
    };
  }, []);
  return session;
}
export function GuestNotice() {
  return (
    <section className={panel} aria-labelledby="guest-title">
      <h2 id="guest-title" className="text-xl font-semibold">
        Tài khoản chưa được bật trên bản triển khai này
      </h2>
      <p className="mt-3 text-muted">
        Bạn vẫn dùng đầy đủ Timer, Luyện tập 3×3, Công thức và Giải đấu ở chế độ
        khách. Lịch sử giải, công thức yêu thích và giải đã lưu nằm trên thiết
        bị này và không bị gửi đi đâu.
      </p>
    </section>
  );
}
export function AccountPanel() {
  const session = useSession();
  // Checked via config so prerendering never creates a client on the server.
  if (!supabaseConfig) return <GuestNotice />;
  if (session === undefined)
    return <LoadingState label="Đang kiểm tra phiên đăng nhập…" />;
  if (!session) return <AuthForms />;
  return <SignedIn session={session} />;
}
function SignedIn({ session }: { session: Session }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const signOut = async () => {
    setBusy(true);
    setError("");
    // "local": only this device; local data stays for guest use.
    try {
      const client = await loadSupabase();
      const { error } = await client!.auth.signOut({ scope: "local" });
      if (error) setError(authMessage(error));
    } catch (e) {
      setError(authMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-6">
      <section className={panel} aria-labelledby="signed-in-title">
        <h2 id="signed-in-title" className="text-xl font-semibold">
          Đã đăng nhập
        </h2>
        <p className="mt-2 break-all text-muted">
          <span className="sr-only">Email: </span>
          {session.user.email}
        </p>
        <p className="mt-3 text-sm text-muted">
          Đăng xuất không xoá dữ liệu trên thiết bị: bạn tiếp tục dùng ở chế độ
          khách như trước.
        </p>
        <Button
          className="mt-4"
          variant="secondary"
          onClick={signOut}
          loading={busy}
        >
          Đăng xuất
        </Button>
        {error && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {error}
          </p>
        )}
      </section>
      <SyncPanel userId={session.user.id} />
    </div>
  );
}
function AuthForms() {
  const [mode, setMode] = useState<Mode>("sign-in"),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [errors, setErrors] = useState<AuthErrors>({}),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const switchMode = (next: Mode) => {
    setMode(next);
    setErrors({});
    setStatus(null);
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const found = validateCredentials(
      email,
      mode === "recover" ? null : password,
    );
    setErrors(found);
    setStatus(null);
    if (Object.keys(found).length) return;
    const address = email.trim();
    setBusy(true);
    try {
      const auth = (await loadSupabase())!.auth;
      if (mode === "sign-in") {
        const { error } = await auth.signInWithPassword({
          email: address,
          password,
        });
        if (error) throw error;
        return;
      }
      if (mode === "sign-up") {
        const { data, error } = await auth.signUp({
          email: address,
          password,
          options: { emailRedirectTo: `${location.origin}/tai-khoan` },
        });
        if (error) throw error;
        if (!data.session)
          setStatus({
            ok: true,
            text: "Đã gửi thư xác nhận. Mở liên kết trong thư để kích hoạt tài khoản rồi đăng nhập.",
          });
        return;
      }
      const { error } = await auth.resetPasswordForEmail(address, {
        redirectTo: `${location.origin}/tai-khoan/dat-lai-mat-khau`,
      });
      if (error) throw error;
      // Same message whether or not the email has an account.
      setStatus({
        ok: true,
        text: "Nếu email này có tài khoản, thư đặt lại mật khẩu sẽ đến trong vài phút.",
      });
    } catch (e) {
      setStatus({ ok: false, text: authMessage(e) });
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className={panel} aria-labelledby="auth-title">
      <h2 id="auth-title" className="text-xl font-semibold">
        {MODES[mode]}
      </h2>
      <div
        className="mt-4 flex flex-wrap gap-2"
        role="group"
        aria-label="Chọn thao tác"
      >
        {(Object.keys(MODES) as Mode[]).map((m) => (
          <Button
            key={m}
            variant={m === mode ? "primary" : "ghost"}
            aria-pressed={m === mode}
            onClick={() => switchMode(m)}
          >
            {MODES[m]}
          </Button>
        ))}
      </div>
      <form className="mt-6 space-y-4" onSubmit={submit} noValidate>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        {mode !== "recover" && (
          <Input
            label="Mật khẩu"
            type="password"
            autoComplete={
              mode === "sign-up" ? "new-password" : "current-password"
            }
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint={mode === "sign-up" ? "Ít nhất 8 ký tự." : undefined}
            error={errors.password}
          />
        )}
        <Button type="submit" loading={busy}>
          {mode === "recover" ? "Gửi thư đặt lại" : MODES[mode]}
        </Button>
      </form>
      {status && (
        <p
          role={status.ok ? "status" : "alert"}
          className={`mt-4 text-sm ${status.ok ? "" : "text-danger"}`}
        >
          {status.text}
        </p>
      )}
      <p className="mt-6 text-sm text-muted">
        Không bắt buộc đăng nhập: bạn vẫn có thể dùng{" "}
        <Link href="/timer" className="underline">
          Timer
        </Link>{" "}
        và{" "}
        <Link href="/practice" className="underline">
          Luyện tập 3×3
        </Link>{" "}
        ở chế độ khách.
      </p>
    </section>
  );
}
