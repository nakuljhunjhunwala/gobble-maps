import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { ColChart } from "@/components/admin/col-chart";
import { BarList } from "@/components/admin/bar-list";
import { TopList } from "@/components/admin/top-list";
import { DashboardRangeSwitcher } from "@/components/admin/dashboard-range-switcher";
import { getDashboard, type DashboardRange } from "@/lib/admin/queries";

const RANGE_LABELS: Record<DashboardRange, string> = {
  today: "today",
  week: "this week",
  month: "this month",
  all: "all time",
};

function parseRange(value: string | string[] | undefined): DashboardRange {
  return value === "today" || value === "week" || value === "month" || value === "all"
    ? value
    : "week";
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const range = parseRange(params.range);
  const rangeLabel = RANGE_LABELS[range];
  const m = await getDashboard(range);

  return (
    <div data-screen-label="Admin Dashboard">
      <PageHeader title="Dashboard" sub={`How Gobble Maps is doing — ${rangeLabel}`}>
        <DashboardRangeSwitcher range={range} />
      </PageHeader>

      <div className="ad-statgrid">
        <StatCard label="Total users" value={m.total_users} />
        <StatCard label="New signups" value={m.new_signups} hint={rangeLabel} />
        <StatCard label="Daily active" value={m.dau} hint="DAU" />
        <StatCard label="Weekly active" value={m.wau} hint="WAU" />
        <StatCard label="Monthly active" value={m.mau} hint="MAU" />
        <StatCard label="Map opens" value={m.map_opens} hint={rangeLabel} />
        <StatCard label="Places shared" value={m.shares} hint={rangeLabel} />
        <StatCard label="Open reports" value={m.open_reports} hint="needs attention" />
      </div>

      <div className="ad-grid2">
        <div className="ad-card">
          <p className="ad-card-title">Map opens per day</p>
          <ColChart
            data={m.map_opens_7d.map((d) => ({ label: d.label, count: d.count }))}
          />
        </div>
        <div className="ad-card">
          <p className="ad-card-title">Most used filters</p>
          <BarList
            rows={m.top_filters
              .slice(0, 6)
              .map((f) => ({ label: f.label, value: f.count }))}
          />
        </div>
      </div>

      <div className="ad-grid3">
        <div className="ad-card">
          <p className="ad-card-title">Most saved · Can&apos;t Wait to Go</p>
          <TopList
            unit="saves"
            rows={m.top_saved.map((p, i) => ({
              rank: i + 1,
              name: p.name,
              count: p.count,
            }))}
          />
        </div>
        <div className="ad-card">
          <p className="ad-card-title">Most visited · Been There</p>
          <TopList
            unit="visits"
            rows={m.top_visited.map((p, i) => ({
              rank: i + 1,
              name: p.name,
              count: p.count,
            }))}
          />
        </div>
        <div className="ad-card">
          <p className="ad-card-title">Most shared</p>
          <TopList
            unit="shares"
            rows={m.top_shared.map((p, i) => ({
              rank: i + 1,
              name: p.name,
              count: p.count,
            }))}
          />
        </div>
      </div>

      <div className="ad-grid2">
        <div className="ad-card">
          <p className="ad-card-title">Most popular areas</p>
          <BarList
            rows={m.top_areas.map((a) => ({
              label: a.label,
              value: a.pct,
              display: `${a.pct}%`,
            }))}
          />
        </div>
        <div className="ad-card">
          <p className="ad-card-title">Most popular cuisines</p>
          <BarList
            rows={m.top_cuisines.map((c) => ({
              label: c.label,
              value: c.pct,
              display: `${c.pct}%`,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
