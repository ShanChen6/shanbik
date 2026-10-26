import type { Metadata } from "next";
import { ToastProvider } from "@/components/ui/toast";
import { ThemeProvider } from "@/providers/theme-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShanBik — Học và luyện tập Rubik",
  description: "Website học, mô phỏng và luyện tập Rubik.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <ToastProvider>
            <div className="flex min-h-dvh flex-col">
              <a href="#main-content" className="skip-link">
                Bỏ qua điều hướng
              </a>
              <SiteHeader />
              <main id="main-content" tabIndex={-1} className="min-w-0 flex-1">
                {children}
              </main>
              <SiteFooter />
            </div>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
