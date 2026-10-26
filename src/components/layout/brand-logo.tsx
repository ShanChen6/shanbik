import Image from "next/image";
import Link from "next/link";

export function BrandLogo() {
  return (
    <Link
      href="/"
      aria-label="ShanBik — Trang chủ"
      className="touch-control relative h-16 w-44 shrink-0 sm:w-48"
    >
      <Image
        src="/brand/shanbik-logo-light.webp"
        alt=""
        width={2048}
        height={684}
        className="h-auto w-full dark:hidden"
        priority
      />
      <Image
        src="/brand/shanbik-logo-dark.webp"
        alt=""
        width={1983}
        height={793}
        className="hidden h-auto w-full dark:block"
      />
    </Link>
  );
}
