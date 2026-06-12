// Gobble Maps consumer — Place detail route loading state. Mirrors PlaceDetail
// (place-detail.tsx): a full-width gallery photo, then the content column —
// badges line, big title, meta line, the 3-button action grid, curator rating
// bars, and a details panel. Built only from the shared gb-skel primitive.

import { SkelBlock, SkelLine } from "@/components/app/skeleton";

export default function Loading() {
  return (
    <div className="gb-screen" style={{ background: "#fff" }}>
      {/* gallery photo (matches the 250px Photo + spacing) */}
      <SkelBlock w="100%" h={260} radius={0} />

      <div
        style={{
          padding: "16px 18px 28px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {/* header: badges, title + score, meta */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <SkelBlock w={72} h={22} radius={99} />
            <SkelBlock w={90} h={22} radius={99} />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <SkelLine w="62%" h={26} />
            <SkelBlock w={48} h={26} radius={99} />
          </div>
          <SkelLine w="80%" h={13} />
          <SkelLine w={120} h={12} />
        </div>

        {/* action button row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
          }}
        >
          {[0, 1, 2].map((i) => (
            <SkelBlock key={i} h={64} radius={13} />
          ))}
        </div>

        {/* curator rating bars */}
        <div
          className="gb-panel"
          style={{ display: "flex", flexDirection: "column", gap: 10 }}
        >
          <SkelLine w={130} h={12} />
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <SkelLine w={64} h={11} />
              <SkelBlock h={5} radius={99} style={{ flex: 1 }} />
              <SkelLine w={28} h={11} />
            </div>
          ))}
        </div>

        {/* details panel (~5 rows) */}
        <div
          className="gb-panel"
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <SkelBlock w={26} h={26} radius={8} />
              <SkelLine w={`${70 - i * 8}%`} h={12} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
