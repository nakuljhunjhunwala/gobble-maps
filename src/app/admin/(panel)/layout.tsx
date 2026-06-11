import "@/app/admin/admin.css";

import type { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/toast";
import { AdminSidebar } from "@/components/admin/sidebar";
import { getOpenReportCount, requireAdmin } from "@/lib/admin/queries";

export const metadata = { title: "Gobble Admin" };

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
