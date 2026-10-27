/** `desktop: false`: shown in the mobile menu and footer; the desktop header uses an icon. */
export const navigationItems: readonly Readonly<{
  href: string;
  label: string;
  desktop?: false;
}>[] = [
  { href: "/", label: "Trang chủ" },
  { href: "/practice", label: "Luyện tập 3×3" },
  { href: "/puzzles", label: "Bách khoa" },
  { href: "/timer", label: "Timer" },
  { href: "/algorithms", label: "Công thức" },
  { href: "/learn", label: "Học cơ bản" },
  { href: "/search", label: "Tìm kiếm", desktop: false },
  { href: "/help", label: "Trợ giúp" },
];
