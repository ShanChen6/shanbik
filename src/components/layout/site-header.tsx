import { BrandLogo } from "./brand-logo";
import { ThemeSwitch } from "./theme-switch";
import { DesktopNavigation, MobileNavigation, SearchLink } from "./navigation";

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="site-container flex min-h-24 items-center justify-between gap-3 py-3">
        <BrandLogo />
        <DesktopNavigation />
        <div className="hidden items-center gap-2 lg:flex">
          <SearchLink />
          <ThemeSwitch />
        </div>
        <MobileNavigation />
      </div>
    </header>
  );
}
