"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SegmentedControl } from "@/components/ui/segmented";
import type { DashboardRange } from "@/lib/admin/queries";

const RANGE_OPTIONS: { value: DashboardRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "all", label: "All time" },
];

export interface DashboardRangeSwitcherProps {
  range: DashboardRange;
}

export function DashboardRangeSwitcher({ range }: DashboardRangeSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setRange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", value);
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <SegmentedControl options={RANGE_OPTIONS} value={range} onChange={setRange} />
  );
}
