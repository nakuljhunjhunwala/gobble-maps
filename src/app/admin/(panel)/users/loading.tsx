import { AdSkelLine, AdSkelRow } from "@/components/admin/skeleton";

// Users skeleton — mirrors UsersManager (header + ad-rows with avatar circles).
export default function UsersLoading() {
  return (
    <div>
      <div className="ad-pagehead">
        <div>
          <AdSkelLine width={90} height={23} radius={8} style={{ marginBottom: 8 }} />
          <AdSkelLine width={180} height={12} />
        </div>
      </div>

      <div className="ad-rows">
        {Array.from({ length: 6 }).map((_, i) => (
          <AdSkelRow key={i} circle thumbSize={36} badges={3} actions={2} />
        ))}
      </div>
    </div>
  );
}
