"use client";
// Gobble Maps consumer — bottom tab bar, ported from the prototype shell
// (design/Gobble Maps Prototype.html: .gb-tabbar / TAB_ICONS / TAB_LABELS).
// Prototype tab buttons become Links; active tab derives from the pathname.
// Shows the user's avatar initial on the Profile tab when logged in.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icons";
import { useUser } from "./providers";

interface TabDef {
  href: string;
  icon: IconName;
  label: string;
}

const TABS: TabDef[] = [
  { href: "/", icon: "home", label: "Home" },
  { href: "/map", icon: "map", label: "Map" },
  { href: "/search", icon: "search", label: "Search" },
  { href: "/profile", icon: "user", label: "Profile" },
];

export function TabBar() {
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <nav className="gb-tabbar">
      {TABS.map((t) => {
        const on =
          t.href === "/"
            ? pathname === "/"
            : pathname === t.href || pathname.startsWith(t.href + "/");
        return (
          <Link
            key={t.href}
            href={t.href}
            className={"gb-tab" + (on ? " gb-tab-on" : "")}
          >
            {t.href === "/profile" && user ? (
              <span
                className="gb-avatar"
                style={{ width: 21, height: 21, fontSize: 10 }}
              >
                {user.username[0].toUpperCase()}
              </span>
            ) : (
              <Icon name={t.icon} size={21} strokeWidth={on ? 2.2 : 1.7} />
            )}
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
