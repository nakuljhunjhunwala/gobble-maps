import { getFilterOptionsWithUsage } from "@/lib/admin/queries";
import { FiltersManager } from "@/components/admin/filters-manager";

export const metadata = { title: "Filters & Categories — Gobble Admin" };

export default async function FiltersPage() {
  const options = await getFilterOptionsWithUsage();
  return <FiltersManager options={options} />;
}
