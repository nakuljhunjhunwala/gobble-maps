"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { ReportStatus } from "@/lib/types";
import { resolveReport } from "@/app/admin/(panel)/reports/actions";
import { Icon } from "@/components/icons";
import { Badge } from "@/components/admin/badge";
import { DataRow } from "@/components/admin/data-row";
import { IconButton } from "@/components/admin/icon-button";
import { PageHeader } from "@/components/admin/page-header";
import { SegmentedControl } from "@/components/ui/segmented";
import { useToast } from "@/components/ui/toast";

export type ReportStatusFilter = "open" | "resolved" | "all";

export interface ReportItem {
  id: string;
  /** Short display id (first 8 chars of the uuid, uppercased). */
  idDisplay: string;
  placeId: string | null;
  placeName: string;
  reporterUsername: string;
  text: string;
  status: ReportStatus;
  dateDisplay: string;
}

export interface ReportsManagerProps {
  status: ReportStatusFilter;
  openCount: number;
  reports: ReportItem[];
}

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "resolved", label: "Resolved" },
  { value: "all", label: "All" },
];

export function ReportsManager({
  status,
  openCount,
  reports,
}: ReportsManagerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const onResolve = (report: ReportItem) => {
    startTransition(async () => {
      const res = await resolveReport(report.id);
      if (res.ok) {
        toast(`${report.idDisplay} marked resolved`);
      } else {
        toast(res.error);
      }
    });
  };

  return (
    <div data-screen-label="Admin Reports">
      <PageHeader
        title="Issue Reports"
        sub={`${openCount} open · submitted by logged-in users`}
      >
        <SegmentedControl
          options={STATUS_OPTIONS}
          value={status}
          onChange={(v) =>
            router.replace(`/admin/reports?status=${v}`, { scroll: false })
          }
        />
      </PageHeader>
      <div className="ad-rows">
        {reports.map((r) => (
          <DataRow
            key={r.id}
            style={{ alignItems: "flex-start" }}
            thumb={
              <span className="ad-detail-ic" style={{ marginTop: 2 }}>
                <Icon
                  name="flag"
                  size={15}
                  color={r.status === "open" ? "#B4514B" : "var(--gb-mut)"}
                />
              </span>
            }
            main={
              <>
                <span className="ad-row-name">
                  {r.placeName}{" "}
                  <span className="ad-sub" style={{ fontWeight: 600 }}>
                    · {r.idDisplay}
                  </span>
                </span>
                <span
                  style={{
                    fontSize: 13,
                    color: "var(--gb-ink)",
                    lineHeight: 1.5,
                    margin: "3px 0",
                  }}
                >
                  “{r.text}”
                </span>
                <span className="ad-sub">
                  by @{r.reporterUsername} · {r.dateDisplay}
                </span>
              </>
            }
            badges={
              <Badge tone={r.status === "open" ? "red" : "green"}>
                {r.status === "open" ? "Open" : "Resolved"}
              </Badge>
            }
            actions={
              <>
                {r.placeId && (
                  <IconButton
                    icon="edit"
                    size={14}
                    title="Edit this place"
                    onClick={() =>
                      router.push(`/admin/places?edit=${r.placeId}`)
                    }
                  />
                )}
                {r.status === "open" && (
                  <button
                    type="button"
                    className="gb-btn gb-btn-sm"
                    style={{ background: "#E8F5EC", color: "#15803D" }}
                    disabled={isPending}
                    onClick={() => onResolve(r)}
                  >
                    <Icon name="check" size={13} strokeWidth={2.6} /> Resolve
                  </button>
                )}
              </>
            }
          />
        ))}
        {reports.length === 0 && (
          <p className="gb-empty" style={{ padding: 20 }}>
            No {status} reports. Quiet day.
          </p>
        )}
      </div>
    </div>
  );
}
