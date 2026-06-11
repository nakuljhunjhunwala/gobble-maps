import {
  getFilterOptionsWithUsage,
  getNotifications,
} from "@/lib/admin/queries";
import { NotificationsManager } from "@/components/admin/notifications-manager";

export default async function NotificationsPage() {
  const [notifications, filterOptions] = await Promise.all([
    getNotifications(),
    getFilterOptionsWithUsage(),
  ]);

  const areas = filterOptions.area.map(({ id, label }) => ({ id, label }));

  return <NotificationsManager notifications={notifications} areas={areas} />;
}
