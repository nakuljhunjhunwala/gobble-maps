"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/icons";
import { signOutAction } from "@/app/admin/(panel)/actions";

const AD_SECTIONS: { href: string; label: string; icon: IconName }[] = [
  { href: "/admin", label: "Dashboard", icon: "home" },
  { href: "/admin/places", label: "Places", icon: "pinOutline" },
  { href: "/admin/filters", label: "Filters & Categories", icon: "sliders" },
  { href: "/admin/users", label: "Users", icon: "user" },
  { href: "/admin/reports", label: "Issue Reports", icon: "flag" },
  { href: "/admin/notifications", label: "Notifications", icon: "share" },
  { href: "/admin/to-be-tried", label: "To Be Tried", icon: "list" },
];

export interface AdminSidebarProps {
  openReports: number;
  email: string;
}

export function AdminSidebar({ openReports, email }: AdminSidebarProps) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/admin"
      ? pathname === "/admin"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="ad-side">
      <div className="ad-brand">
        <span className="ad-brand-mark">
          <Icon name="pinOutline" size={17} color="#fff" strokeWidth={2.2} />
        </span>
        <span className="ad-brand-text">Gobble Admin</span>
      </div>
      <nav className="ad-nav">
        {AD_SECTIONS.map(({ href, label, icon }) => {
          const on = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn("ad-navbtn", on && "ad-navbtn-on")}
            >
              <Icon name={icon} size={16} strokeWidth={on ? 2.2 : 1.8} />{" "}
              {label}
              {href === "/admin/reports" && openReports > 0 && (
                <span className="ad-navcount">{openReports}</span>
              )}
            </Link>
          );
        })}
      </nav>
      <Link className="ad-applink" href="/">
        <Icon name="map" size={15} color="var(--gb-deep)" /> View the app →
      </Link>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          borderTop: "1px solid var(--gb-line)",
          marginTop: 8,
          paddingTop: 10,
        }}
      >
        <span
          className="ad-sub"
          style={{
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={email}
        >
          {email}
        </span>
        <form action={signOutAction}>
          <button className="ad-iconbtn" type="submit" title="Sign out">
            <Icon name="logout" size={15} strokeWidth={2} />
          </button>
        </form>
      </div>
    </aside>
  );
}
