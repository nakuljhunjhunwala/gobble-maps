// Gobble Maps consumer — Profile route loading state. Mirrors ProfileScreen
// (profile-screen.tsx): identity row (avatar + name + stats), the 3-segment
// tab switcher, then a few saved-place card rows. Built only from gb-skel.

import { SkelBlock, SkelCardRow, SkelCircle, SkelLine } from "@/components/app/skeleton";

export default function Loading() {
  return (
    <div className="gb-screen">
      <div
        style={{
          padding: "14px 18px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* identity */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <SkelCircle size={54} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <SkelLine w={150} h={20} />
            <SkelLine w={220} h={12} />
          </div>
        </div>

        {/* 3-segment tab block */}
        <SkelBlock h={38} radius={11} style={{ width: "100%" }} />

        {/* saved place rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[0, 1, 2].map((i) => (
            <SkelCardRow key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
