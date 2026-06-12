import { AdSkelLine, AdSkelRow } from "@/components/admin/skeleton";

// Places list skeleton — mirrors PlacesManager (header + toolbar + ad-rows).
export default function PlacesLoading() {
  return (
    <div>
      <div className="ad-pagehead">
        <div>
          <AdSkelLine width={110} height={23} radius={8} style={{ marginBottom: 8 }} />
          <AdSkelLine width={300} height={12} />
        </div>
        <span
          className="gb-skel"
          style={{ width: 138, height: 34, borderRadius: 10 }}
        />
      </div>

      <div className="ad-toolbar">
        <span className="gb-skel" style={{ width: 320, height: 34, borderRadius: 10 }} />
        <span className="gb-skel ad-search" style={{ height: 34, borderRadius: 10 }} />
      </div>

      <div className="ad-rows">
        {Array.from({ length: 6 }).map((_, i) => (
          <AdSkelRow key={i} thumbSize={46} thumbRadius={11} badges={2} actions={4} />
        ))}
      </div>
    </div>
  );
}
