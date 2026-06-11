import { getUsers, requireAdmin } from "@/lib/admin/queries";
import { UsersManager } from "@/components/admin/users-manager";

export default async function UsersPage() {
  await requireAdmin();
  const users = await getUsers();
  return <UsersManager users={users} />;
}
