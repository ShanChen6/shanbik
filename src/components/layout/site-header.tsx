import Link from "next/link";
import { BrandLogo } from "./brand-logo";
import { ThemeSelect } from "./theme-select";

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="site-container flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-4">
        <BrandLogo />
        <ThemeSelect />
        <nav
          aria-label="Điều hướng chính"
          className="w-full border-t border-border pt-2 sm:order-none sm:w-auto sm:border-0 sm:pt-0"
        >
          <ul className="flex flex-wrap gap-x-6 gap-y-1 text-sm font-semibold">
            <li>
              <Link
                className="touch-control text-primary hover:underline"
                href="/#overview"
              >
                Giới thiệu
              </Link>
            </li>
            <li>
              <Link
                className="touch-control text-muted hover:text-foreground"
                href="/#progress"
              >
                Sắp ra mắt
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
