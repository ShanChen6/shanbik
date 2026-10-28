"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { navigationItems } from "@/config/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog";
import { ThemeSwitch } from "./theme-switch";

function NavigationLinks({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  return (
    <ul className={mobile ? "grid gap-2" : "flex flex-wrap items-center gap-1"}>
      {navigationItems
        .filter((item) => mobile || item.desktop !== false)
        .map((item) => {
          const current =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const link = (
            <Link
              href={item.href}
              aria-current={current ? "page" : undefined}
              className={`touch-control rounded-lg px-3 py-2 text-sm font-semibold ${mobile ? "w-full justify-start" : ""} ${current ? "bg-surface-subtle text-primary underline decoration-2 underline-offset-4" : "text-muted hover:bg-surface-subtle hover:text-foreground"}`}
            >
              {item.label}
            </Link>
          );
          return (
            <li key={item.href}>
              {mobile ? <DialogClose asChild>{link}</DialogClose> : link}
            </li>
          );
        })}
    </ul>
  );
}

/** Desktop header search entry; the label stays available to assistive tech. */
export function SearchLink() {
  const pathname = usePathname();
  const current = pathname === "/search";
  return (
    <Link
      href="/search"
      aria-label="Tìm kiếm"
      title="Tìm kiếm"
      aria-current={current ? "page" : undefined}
      className={`touch-control rounded-lg ${current ? "bg-surface-subtle text-primary" : "text-muted hover:bg-surface-subtle hover:text-foreground"}`}
    >
      <svg
        aria-hidden="true"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    </Link>
  );
}

export function DesktopNavigation() {
  return (
    <nav aria-label="Điều hướng chính" className="hidden lg:block">
      <NavigationLinks />
    </nav>
  );
}

export function MobileNavigation() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 64rem)");
    const closeOnDesktop = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);
  return (
    <div className="lg:hidden">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="secondary">Menu</Button>
        </DialogTrigger>
        <DialogContent
          variant="sheet"
          title="Điều hướng"
          description="Khám phá ShanBik và chọn giao diện bạn yêu thích."
        >
          <nav aria-label="Điều hướng di động">
            <NavigationLinks mobile />
          </nav>
          <div className="mt-6 border-t border-border pt-6">
            <ThemeSwitch />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Desktop header account entry (icon only, labelled). */
export function AccountLink() {
  const pathname = usePathname();
  const current =
    pathname === "/tai-khoan" || pathname.startsWith("/tai-khoan/");
  return (
    <Link
      href="/tai-khoan"
      aria-label="Tài khoản"
      title="Tài khoản"
      aria-current={current ? "page" : undefined}
      className={`touch-control rounded-lg ${current ? "bg-surface-subtle text-primary" : "text-muted hover:bg-surface-subtle hover:text-foreground"}`}
    >
      <svg
        aria-hidden="true"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </svg>
    </Link>
  );
}
