import { getTbt } from "@/lib/admin/queries";
import { TbtManager } from "@/components/admin/tbt-manager";

export default async function ToBeTriedPage() {
  const items = await getTbt();

  return <TbtManager items={items} />;
}
