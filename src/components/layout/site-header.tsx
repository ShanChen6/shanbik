import { BrandLogo } from "./brand-logo";
import { ThemeSelect } from "./theme-select";
import { DesktopNavigation, MobileNavigation } from "./navigation";

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="site-container flex min-h-24 items-center justify-between gap-3 py-3">
        <BrandLogo />
        <DesktopNavigation />
        <div className="hidden lg:block">
          <ThemeSelect />
        </div>
        <MobileNavigation />
      </div>
    </header>
  );
}
