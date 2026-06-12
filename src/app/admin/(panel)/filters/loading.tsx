import { AdSkelLine } from "@/components/admin/skeleton";

// Filters skeleton — mirrors FiltersManager (header + ad-grid3 of option cards).
export default function FiltersLoading() {
  return (
    <div>
      <div className="ad-pagehead">
        <div>
          <AdSkelLine width={190} height={23} radius={8} style={{ marginBottom: 8 }} />
          <AdSkelLine width={320} height={12} />
        </div>
      </div>

      <div className="ad-grid3">
        {Array.from({ length: 3 }).map((_, c) => (
          <div key={c} className="ad-card">
            <AdSkelLine width={120} height={12} style={{ marginBottom: 12 }} />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                marginBottom: 10,
              }}
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="ad-fopt">
                  <AdSkelLine width="55%" height={13} style={{ flex: 1 }} />
                  <AdSkelLine width={42} height={10} />
                  <span
                    className="gb-skel"
                    style={{ width: 22, height: 22, borderRadius: 8 }}
                  />
                  <span
                    className="gb-skel"
                    style={{ width: 22, height: 22, borderRadius: 8 }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <span
                className="gb-skel"
                style={{ flex: 1, height: 34, borderRadius: 10 }}
              />
              <span
                className="gb-skel"
                style={{ width: 38, height: 34, borderRadius: 10 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
