// Gobble Maps consumer — (app) shell layout (server component).
// Fetches admin-managed filter options + the session user's data, then
// renders the centered .g-shell column with client providers, the offline
// banner, and the fixed bottom tab bar. Admin routes have their own layout.

import type { ReactNode } from "react";
import "@/app/app.css";
import "./toast.css";
import { ToastProvider } from "@/components/ui/toast";
import { GOfflineBanner } from "@/components/app/atoms";
import { InstallBanner } from "@/components/app/install-banner";
import { Providers } from "@/components/app/providers";
import { TabBar } from "@/components/app/tab-bar";
import { getActiveFilterOptions } from "@/lib/consumer/queries";
import { getMyData } from "@/lib/consumer/user-actions";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [filterOptions, myData] = await Promise.all([
    getActiveFilterOptions(),
    getMyData(),
  ]);

  return (
    <ToastProvider>
      <Providers initialData={myData} filterOptions={filterOptions}>
        <div className="g-shell">
          <InstallBanner />
          <GOfflineBanner />
          {children}
          <TabBar />
        </div>
      </Providers>
    </ToastProvider>
  );
}
