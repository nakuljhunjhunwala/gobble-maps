import type { MetadataRoute } from "next";

// PWA manifest for Gobble Maps — installable home-screen app.
// Icons point at the existing PNGs in public/icons/.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gobble Maps",
    short_name: "Gobble",
    description: "Personally curated food & nightlife guide for Mumbai",
    start_url: "/",
    display: "standalone",
    theme_color: "#1D7FB8",
    background_color: "#F4F8FB",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
