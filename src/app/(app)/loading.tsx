// Gobble Maps consumer — Home route loading state. A home-shaped skeleton that
// mirrors HomeScreen (home-screen.tsx): header row, search bar, a meal rail of
// wide cards, the map preview block, then the vertical list of card rows. Built
// only from the shared gb-skel primitive (see skeleton.tsx / globals.css).

import {
  SkelBlock,
  SkelCardRow,
  SkelCardWide,
  SkelCircle,
  SkelLine,
} from "@/components/app/skeleton";

export default function Loading() {
  return (
    <div className="gb-screen">
      {/* header (matches HomeScreen header padding) */}
      <header
        style={{
          padding: "8px 18px 2px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <SkelBlock w={30} h={30} radius={10} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <SkelLine w={110} h={14} />
            <SkelLine w={150} h={10} />
          </div>
        </div>
        <SkelCircle size={34} />
      </header>

      {/* search + filter row */}
      <div style={{ display: "flex", gap: 8, padding: "12px 18px 4px" }}>
        <SkelBlock h={42} radius={13} style={{ flex: 1 }} />
        <SkelBlock w={42} h={42} radius={13} />
      </div>

      {/* meal rail */}
      <div style={{ marginTop: 14 }}>
        <div style={{ padding: "0 18px", display: "flex", flexDirection: "column", gap: 6 }}>
          <SkelLine w={140} h={16} />
          <SkelLine w={200} h={11} />
        </div>
        <div className="gb-rail" style={{ marginTop: 10 }}>
          {[0, 1, 2].map((i) => (
            <SkelCardWide key={i} />
          ))}
        </div>
      </div>

      {/* map preview */}
      <div style={{ marginTop: 6 }}>
        <div style={{ padding: "0 18px", display: "flex", flexDirection: "column", gap: 6 }}>
          <SkelLine w={110} h={16} />
          <SkelLine w={170} h={11} />
        </div>
        <SkelBlock
          h={150}
          radius={16}
          style={{ width: "calc(100% - 36px)", margin: "10px 18px 0" }}
        />
      </div>

      {/* vertical list */}
      <div style={{ marginTop: 18, paddingBottom: 24 }}>
        <div style={{ padding: "0 18px", display: "flex", flexDirection: "column", gap: 6 }}>
          <SkelLine w={100} h={16} />
          <SkelLine w={160} h={11} />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: "10px 18px 0",
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <SkelCardRow key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
