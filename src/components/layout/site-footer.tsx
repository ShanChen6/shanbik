import Link from "next/link";
import { BrandLogo } from "./brand-logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="site-container flex flex-col gap-3 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <div>
          <BrandLogo />
          <p>Học từng bước. Tiến bộ mỗi ngày.</p>
        </div>
        <Link
          className="touch-control self-start font-semibold text-primary hover:underline"
          href="/#overview"
        >
          Về đầu trang ↑
        </Link>
      </div>
    </footer>
  );
}
