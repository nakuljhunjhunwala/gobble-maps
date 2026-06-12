// Gobble Maps — shared loaders for ImageResponse (next/og) routes.
// Server-only: reads committed assets off disk at render time.

import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/** Bricolage Grotesque Bold — satori needs raw TTF bytes (no next/font). */
export async function loadBrandFont(): Promise<Buffer> {
  return readFile(
    join(process.cwd(), "src/assets/fonts/BricolageGrotesque-Bold.ttf")
  );
}

/** The badge logo as a data URI for <img> inside ImageResponse JSX. */
export async function loadLogoDataUri(): Promise<string> {
  const svg = await readFile(
    join(process.cwd(), "public/icons/icon.svg"),
    "base64"
  );
  return `data:image/svg+xml;base64,${svg}`;
}
