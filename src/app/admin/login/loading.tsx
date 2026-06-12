import "@/app/admin/admin.css";

import { AdSkelLine } from "@/components/admin/skeleton";

// Login skeleton — mirrors the centered ad-card on the admin login page.
export default function LoginLoading() {
  return (
    <div
      className="ad-root"
      style={{
        display: "flex",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
      }}
    >
      <div className="ad-card" style={{ width: "100%", maxWidth: 380 }}>
        <div
          className="ad-brand"
          style={{ padding: "4px 0 14px", gap: 9 }}
        >
          <span
            className="gb-skel gb-skel-circle"
            style={{ width: 30, height: 30, borderRadius: 10 }}
          />
          <AdSkelLine width={130} height={16} radius={8} />
        </div>

        <AdSkelLine width="90%" height={12} style={{ marginBottom: 14 }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i}>
              <AdSkelLine width={70} height={10} style={{ marginBottom: 6 }} />
              <span
                className="gb-skel"
                style={{ display: "block", width: "100%", height: 38, borderRadius: 10 }}
              />
            </div>
          ))}
          <span
            className="gb-skel"
            style={{ display: "block", width: "100%", height: 40, borderRadius: 10 }}
          />
        </div>
      </div>
    </div>
  );
}
