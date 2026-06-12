import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

// Served at /robots.txt. Admin, APIs and the personal profile screen are
// for humans/the app only; everything else is crawlable.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/profile"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
