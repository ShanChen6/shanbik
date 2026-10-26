import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShanBik — Học và luyện tập Rubik",
  description: "Website học, mô phỏng và luyện tập Rubik.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
