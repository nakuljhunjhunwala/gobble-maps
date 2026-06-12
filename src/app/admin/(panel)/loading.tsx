import {
  AdSkelLine,
  AdSkelStatCard,
  AdSkelCard,
} from "@/components/admin/skeleton";

// Dashboard skeleton — mirrors (panel)/page.tsx layout/classes.
export default function DashboardLoading() {
  return (
    <div>
      <div className="ad-pagehead">
        <div>
          <AdSkelLine width={150} height={23} radius={8} style={{ marginBottom: 8 }} />
          <AdSkelLine width={240} height={12} />
        </div>
        <span
          className="gb-skel"
          style={{ width: 230, height: 34, borderRadius: 10 }}
        />
      </div>

      <div className="ad-statgrid">
        {Array.from({ length: 8 }).map((_, i) => (
          <AdSkelStatCard key={i} />
        ))}
      </div>

      <div className="ad-grid2">
        <AdSkelCard title height={200} />
        <AdSkelCard title height={200} />
      </div>

      <div className="ad-grid3">
        <AdSkelCard title height={160} />
        <AdSkelCard title height={160} />
        <AdSkelCard title height={160} />
      </div>

      <div className="ad-grid2">
        <AdSkelCard title height={160} />
        <AdSkelCard title height={160} />
      </div>
    </div>
  );
}
