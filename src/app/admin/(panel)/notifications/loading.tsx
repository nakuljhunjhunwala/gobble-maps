import { AdSkelLine, AdSkelRow } from "@/components/admin/skeleton";

// Notifications skeleton — mirrors NotificationsManager (header + compose card
// + history list).
export default function NotificationsLoading() {
  return (
    <div>
      <div className="ad-pagehead">
        <div>
          <AdSkelLine width={190} height={23} radius={8} style={{ marginBottom: 8 }} />
          <AdSkelLine width={340} height={12} />
        </div>
      </div>

      <div className="ad-card" style={{ marginBottom: 14 }}>
        <AdSkelLine width={90} height={12} style={{ marginBottom: 12 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <span
            className="gb-skel"
            style={{ display: "block", width: "100%", height: 60, borderRadius: 10 }}
          />
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span
              className="gb-skel"
              style={{ width: 250, height: 34, borderRadius: 10 }}
            />
            <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
              <span
                className="gb-skel"
                style={{ width: 92, height: 34, borderRadius: 10 }}
              />
              <span
                className="gb-skel"
                style={{ width: 92, height: 34, borderRadius: 10 }}
              />
            </div>
          </div>
        </div>
      </div>

      <AdSkelLine width={70} height={12} style={{ margin: "0 0 8px 2px" }} />

      <div className="ad-rows">
        {Array.from({ length: 4 }).map((_, i) => (
          <AdSkelRow
            key={i}
            thumbSize={34}
            thumbRadius={10}
            badges={1}
            actions={0}
            style={{ alignItems: "flex-start" }}
          />
        ))}
      </div>
    </div>
  );
}
