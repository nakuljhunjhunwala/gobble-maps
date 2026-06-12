// Per-place Open Graph image: photo panel (when available) + name, type,
// area · cuisines and curator rating on the brand gradient. Falls back to
// the generic brand card for missing/closed places or photo fetch failures.

import { ImageResponse } from "next/og";
import { getPlace } from "@/lib/consumer/queries";
import { GOBBLE_TYPES } from "@/lib/consumer/place-types";
import { photoUrl } from "@/lib/admin/format";
import { SITE_NAME, SITE_TAGLINE, BRAND, OG_SIZE } from "@/lib/site";
import { loadBrandFont, loadLogoDataUri } from "@/lib/seo/og-assets";

export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = OG_SIZE;
export const contentType = "image/png";

interface Props {
  params: Promise<{ id: string }>;
}

async function fetchPhotoDataUri(storagePath: string): Promise<string | null> {
  try {
    const res = await fetch(photoUrl(storagePath), {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "image/jpeg";
    const b64 = Buffer.from(await res.arrayBuffer()).toString("base64");
    return `data:${type};base64,${b64}`;
  } catch {
    return null;
  }
}

export default async function Image({ params }: Props) {
  const { id } = await params;
  const [font, logo, place] = await Promise.all([
    loadBrandFont(),
    loadLogoDataUri(),
    getPlace(id).catch(() => null),
  ]);
  const fonts = [
    { name: "Bricolage", data: font, style: "normal" as const, weight: 700 as const },
  ];

  // Missing or permanently closed → generic brand card.
  if (!place || place.permanentlyClosed) {
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
      { ...size, fonts }
    );
  }

  const photo = place.photoPaths[0]
    ? await fetchPhotoDataUri(place.photoPaths[0])
    : null;
  const subtitle = [place.area ?? "Mumbai", place.cuisines.slice(0, 3).join(", ")]
    .filter(Boolean)
    .join(" · ");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: `linear-gradient(135deg, ${BRAND.gradientFrom}, ${BRAND.gradientTo})`,
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "56px 64px",
            color: "#fff",
          }}
        >
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              fontSize: 28,
              padding: "8px 24px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.22)",
            }}
          >
            {GOBBLE_TYPES[place.type].label}
          </div>
          <div
            style={{
              fontSize: place.name.length > 22 ? 64 : 84,
              fontFamily: "Bricolage",
              lineHeight: 1.08,
              marginTop: 28,
            }}
          >
            {place.name}
          </div>
          {subtitle ? (
            <div style={{ fontSize: 34, opacity: 0.92, marginTop: 18 }}>
              {subtitle}
            </div>
          ) : null}
          {place.ratings ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                fontSize: 34,
                marginTop: 18,
              }}
            >
              {/* drawn star: neither bundled font has the ★ glyph */}
              <svg width="34" height="34" viewBox="0 0 24 24" fill="#fff">
                <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.2l7.1-.6z" />
              </svg>
              {`${place.ratings.avg} / 5`}
            </div>
          ) : null}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginTop: "auto",
              paddingTop: 32,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} width={56} height={56} alt="" />
            <div style={{ fontSize: 30, fontFamily: "Bricolage" }}>{SITE_NAME}</div>
          </div>
        </div>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            width={470}
            height={630}
            alt=""
            style={{ objectFit: "cover" }}
          />
        ) : null}
      </div>
    ),
    { ...size, fonts }
  );
}
