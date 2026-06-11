import {
  formatDate,
  getOpenReportCount,
  getReports,
} from "@/lib/admin/queries";
import {
  ReportsManager,
  type ReportItem,
  type ReportStatusFilter,
} from "@/components/admin/reports-manager";

interface ReportsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = await searchParams;
  const status: ReportStatusFilter =
    params.status === "resolved" || params.status === "all"
      ? params.status
      : "open";

  const [reports, openCount] = await Promise.all([
    getReports(status === "all" ? undefined : status),
    getOpenReportCount(),
  ]);

  const items: ReportItem[] = reports.map((r) => ({
    id: r.id,
    idDisplay: r.id.slice(0, 8).toUpperCase(),
    placeId: r.place_id,
    placeName: r.place_name,
    reporterUsername: r.reporter_username,
    text: r.text,
    status: r.status,
    dateDisplay: formatDate(r.created_at),
  }));

  return <ReportsManager status={status} openCount={openCount} reports={items} />;
}
