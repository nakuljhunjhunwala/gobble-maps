import Link from "next/link";
import { Icon } from "@/components/icons";

export default function Home() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        background: "var(--gb-bg)",
        color: "var(--gb-ink)",
        padding: 24,
        textAlign: "center",
      }}
    >
      <span
        style={{
          width: 54,
          height: 54,
          borderRadius: 18,
          background: "linear-gradient(140deg, var(--gb-sky), var(--gb-deep))",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 6px rgba(29,127,184,0.35)",
        }}
      >
        <Icon name="pinOutline" size={28} color="#fff" strokeWidth={2.2} />
      </span>
      <h1
        style={{
          fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif",
          fontSize: 32,
          fontWeight: 800,
          letterSpacing: "-0.02em",
        }}
      >
        Gobble Maps
      </h1>
      <p style={{ fontSize: 14, color: "var(--gb-mut)" }}>
        Consumer app coming soon
      </p>
      <Link
        href="/admin"
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "var(--gb-deep)",
          textDecoration: "none",
        }}
      >
        Open the admin panel →
      </Link>
    </div>
  );
}
