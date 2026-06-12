// Default Open Graph image — brand hero card. Inherited by every route
// that does not define its own opengraph-image. Twitter reuses it
// automatically (no twitter-image file needed).

import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE, BRAND, OG_SIZE } from "@/lib/site";
import { loadBrandFont, loadLogoDataUri } from "@/lib/seo/og-assets";

export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  const [font, logo] = await Promise.all([loadBrandFont(), loadLogoDataUri()]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 56,
          background: `linear-gradient(135deg, ${BRAND.gradientFrom}, ${BRAND.gradientTo})`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} width={240} height={240} alt="" />
        <div style={{ display: "flex", flexDirection: "column", color: "#fff" }}>
          <div style={{ fontSize: 100, fontFamily: "Bricolage", lineHeight: 1.1 }}>
            {SITE_NAME}
          </div>
          <div style={{ fontSize: 40, opacity: 0.92, marginTop: 8 }}>
            {SITE_TAGLINE}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Bricolage", data: font, style: "normal", weight: 700 }],
    }
  );
}
