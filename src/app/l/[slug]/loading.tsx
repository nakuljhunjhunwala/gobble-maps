// Gobble Maps consumer — public list ('/l/[slug]') loading state. Standalone
// route OUTSIDE the (app) group, so it renders the shell column (.g-shell)
// WITHOUT the bottom tab bar and imports the consumer CSS itself. Mirrors
// PublicList (public-list.tsx): brand row, title line, "curated by" line, then
// list card rows. Built only from the shared gb-skel primitive.

import "@/app/app.css";
import { SkelBlock, SkelCardRow, SkelLine } from "@/components/app/skeleton";

export default function Loading() {
  return (
    <div className="g-shell">
      <div className="gb-screen">
        {/* brand row */}
        <header
          style={{
            padding: "12px 18px 2px",
            display: "flex",
            alignItems: "center",
            gap: 9,
          }}
        >
          <SkelBlock />
          <SkelLine w={110} h={14} />
        </header>

        {/* title + curated-by */}
        <div
          style={{
            padding: "16px 18px 8px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <SkelLine w="60%" h={24} />
          <SkelLine w={200} h={12} />
        </div>

        {/* list rows */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: "8px 18px 0",
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

/** Brand-mark sized square, kept local to avoid an extra import alias. */
function SkelBlock() {
  return <SkelCircle size={30} style={{ borderRadius: 10 }} />;
}
