// Open Graph image for public shared lists: list name, owner and place
// count on the brand gradient. Missing/private lists get the brand card.

import { ImageResponse } from "next/og";
import { getPublicList } from "./queries";
import { SITE_NAME, SITE_TAGLINE, BRAND, OG_SIZE } from "@/lib/site";
import { loadBrandFont, loadLogoDataUri } from "@/lib/seo/og-assets";

export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = OG_SIZE;
export const contentType = "image/png";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function Image({ params }: Props) {
  const { slug } = await params;
  const [font, logo, list] = await Promise.all([
    loadBrandFont(),
    loadLogoDataUri(),
    getPublicList(slug).catch(() => null),
  ]);
  const fonts = [
    { name: "Bricolage", data: font, style: "normal" as const, weight: 700 as const },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "56px 72px",
          color: "#fff",
          background: `linear-gradient(135deg, ${BRAND.gradientFrom}, ${BRAND.gradientTo})`,
        }}
      >
        {list ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 32, opacity: 0.92 }}>
              {`A list by @${list.username}`}
            </div>
            <div
              style={{
                fontSize: list.name.length > 24 ? 64 : 88,
                fontFamily: "Bricolage",
                lineHeight: 1.08,
                marginTop: 20,
              }}
            >
              {list.name}
            </div>
            <div style={{ fontSize: 36, opacity: 0.92, marginTop: 22 }}>
              {`${list.places.length} place${list.places.length === 1 ? "" : "s"} in Mumbai`}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 96, fontFamily: "Bricolage" }}>{SITE_NAME}</div>
        )}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginTop: 64,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} width={56} height={56} alt="" />
          <div style={{ fontSize: 30, fontFamily: "Bricolage" }}>{SITE_NAME}</div>
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
