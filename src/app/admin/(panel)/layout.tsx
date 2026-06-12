import "@/app/admin/admin.css";

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/toast";
import { AdminSidebar } from "@/components/admin/sidebar";
import { getOpenReportCount, requireAdmin } from "@/lib/admin/queries";

// robots propagates to every panel page (shallow metadata merge);
// title.absolute opts out of the consumer "%s — Gobble Maps" template.
export const metadata: Metadata = {
  title: { absolute: "Gobble Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminPanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = await requireAdmin();
  const openReports = await getOpenReportCount();

  return (
    <ToastProvider>
      <div className="ad-root">
        <AdminSidebar openReports={openReports} email={user.email ?? ""} />
        <main className="ad-main">{children}</main>
      </div>
    </ToastProvider>
  );
}
