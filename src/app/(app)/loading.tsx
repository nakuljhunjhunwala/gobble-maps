// Gobble Maps consumer — route loading state: centered brand mark with a
// soft pulse ring (gbpulse keyframes live in app.css; gb tokens in globals).

import { Icon } from "@/components/icons";

export default function Loading() {
  return (
    <div
      className="gb-screen"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span style={{ position: "relative", display: "inline-flex" }}>
        <span
          style={{
            position: "absolute",
            inset: -12,
            borderRadius: 99,
            background: "rgba(61,165,222,0.25)",
            animation: "gbpulse 1.6s ease-out infinite",
          }}
        ></span>
        <span
          className="gb-brand-mark"
          style={{
            width: 46,
            height: 46,
            borderRadius: 14,
            position: "relative",
          }}
        >
          <Icon name="pinOutline" size={24} color="#fff" strokeWidth={2.2} />
        </span>
      </span>
    </div>
  );
}
