import Link from "next/link";
import { BrandLogo } from "./brand-logo";
import { navigationItems } from "@/config/navigation";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="site-container flex flex-col gap-6 py-8 text-sm text-muted md:flex-row md:items-center md:justify-between">
        <div>
          <BrandLogo />
          <p>Học từng bước. Tiến bộ mỗi ngày.</p>
        </div>
        <nav aria-label="Liên kết nhanh">
          <ul className="flex flex-wrap gap-x-5 gap-y-1">
            {navigationItems.map((item) => (
              <li key={item.href}>
                <Link
                  className="touch-control font-semibold hover:text-primary hover:underline"
                  href={item.href}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <a
          className="touch-control self-start font-semibold text-primary hover:underline md:self-center"
          href="#main-content"
        >
          Về đầu trang ↑
        </a>
      </div>
    </footer>
  );
}
