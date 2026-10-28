"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/states";
import { GuestNotice, useSession } from "./account-panel";
import { authMessage, validateCredentials } from "./auth";
import { getSupabase, supabaseConfig } from "./supabase";
/**
 * Landing page of the recovery email: supabase-js exchanges the one-time code
 * in the URL for a session (PKCE), then the user sets a new password.
 */
export function ResetPassword() {
  const session = useSession();
  const [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState(false);
  if (!supabaseConfig) return <GuestNotice />;
  if (session === undefined)
    return <LoadingState label="Đang xác minh liên kết…" />;
  if (done)
    return (
      <p
        role="status"
        className="rounded-panel border border-border bg-surface p-5 sm:p-8"
      >
        Đã đổi mật khẩu.{" "}
        <Link href="/tai-khoan" className="underline">
          Về trang tài khoản
        </Link>
      </p>
    );
  if (!session)
    return (
      <div
        role="alert"
        className="rounded-panel border border-border bg-surface p-5 sm:p-8"
      >
        <p className="font-semibold">
          Liên kết đặt lại không hợp lệ hoặc đã hết hạn.
        </p>
        <p className="mt-2 text-muted">
          Mở trang{" "}
          <Link href="/tai-khoan" className="underline">
            Tài khoản
          </Link>
          , chọn “Quên mật khẩu” để nhận thư mới.
        </p>
      </div>
    );
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const found = validateCredentials(null, password);
    setError(found.password ?? "");
    if (found.password) return;
    setBusy(true);
    const { error } = await getSupabase()!.auth.updateUser({ password });
    setBusy(false);
    if (error) setError(authMessage(error));
    else setDone(true);
  };
  return (
    <form
      className="space-y-4 rounded-panel border border-border bg-surface p-5 sm:p-8"
      onSubmit={submit}
      noValidate
    >
      <Input
        label="Mật khẩu mới"
        type="password"
        autoComplete="new-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        hint="Ít nhất 8 ký tự."
        error={error}
      />
      <Button type="submit" loading={busy}>
        Lưu mật khẩu mới
      </Button>
    </form>
  );
}
