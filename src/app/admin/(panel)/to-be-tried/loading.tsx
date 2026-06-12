import { AdSkelLine, AdSkelRow } from "@/components/admin/skeleton";

// To Be Tried skeleton — mirrors TbtManager (header + add card + pipeline rows).
export default function ToBeTriedLoading() {
  return (
    <div>
      <div className="ad-pagehead">
        <div>
          <AdSkelLine width={140} height={23} radius={8} style={{ marginBottom: 8 }} />
          <AdSkelLine width={280} height={12} />
        </div>
      </div>

      <div className="ad-card" style={{ marginBottom: 14 }}>
        <AdSkelLine width={120} height={12} style={{ marginBottom: 12 }} />
        <div className="ad-form" style={{ gap: 10 }}>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i}>
              <AdSkelLine width={80} height={10} style={{ marginBottom: 6 }} />
              <span
                className="gb-skel"
                style={{ display: "block", width: "100%", height: 34, borderRadius: 10 }}
              />
            </div>
          ))}
          <div style={{ gridColumn: "1 / -1" }}>
            <AdSkelLine width={120} height={10} style={{ marginBottom: 6 }} />
            <span
              className="gb-skel"
              style={{ display: "block", width: "100%", height: 34, borderRadius: 10 }}
            />
          </div>
          <div>
            <span
              className="gb-skel"
              style={{ width: 80, height: 34, borderRadius: 10, display: "inline-block" }}
            />
          </div>
        </div>
      </div>

      <div className="ad-rows">
        {Array.from({ length: 4 }).map((_, i) => (
          <AdSkelRow key={i} thumbSize={34} thumbRadius={10} badges={0} actions={2} />
        ))}
      </div>
    </div>
  );
}
