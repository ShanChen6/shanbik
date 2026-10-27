/** `desktop: false`: mobile menu and footer only (desktop uses the logo/search icon). */
export const navigationItems: readonly Readonly<{
  href: string;
  label: string;
  desktop?: false;
}>[] = [
  // The logo links home on desktop, which frees a slot in the header row.
  { href: "/", label: "Trang chủ", desktop: false },
  { href: "/practice", label: "Luyện tập 3×3" },
  { href: "/puzzles", label: "Bách khoa" },
  { href: "/timer", label: "Timer" },
  { href: "/algorithms", label: "Công thức" },
  { href: "/learn", label: "Học cơ bản" },
  { href: "/competitions", label: "Giải đấu" },
  { href: "/search", label: "Tìm kiếm", desktop: false },
  { href: "/help", label: "Trợ giúp" },
];
