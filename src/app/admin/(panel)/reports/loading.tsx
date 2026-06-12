import { AdSkelLine, AdSkelRow } from "@/components/admin/skeleton";

// Reports skeleton — mirrors ReportsManager (header + segmented + ad-rows).
export default function ReportsLoading() {
  return (
    <div>
      <div className="ad-pagehead">
        <div>
          <AdSkelLine width={150} height={23} radius={8} style={{ marginBottom: 8 }} />
          <AdSkelLine width={250} height={12} />
        </div>
        <span
          className="gb-skel"
          style={{ width: 180, height: 34, borderRadius: 10 }}
        />
      </div>

      <div className="ad-rows">
        {Array.from({ length: 5 }).map((_, i) => (
          <AdSkelRow
            key={i}
            thumbSize={34}
            thumbRadius={10}
            badges={1}
            actions={1}
            style={{ alignItems: "flex-start" }}
          />
        ))}
      </div>
    </div>
  );
}
