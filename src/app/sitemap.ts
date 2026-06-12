import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { SITE_URL } from "@/lib/site";

// Served at /sitemap.xml, regenerated at most hourly. Uses a cookie-less
// anon client (NOT @/lib/supabase/server — that reads cookies() and would
// force per-request rendering); RLS already scopes anon reads to published
// rows, the status filter just makes the intent explicit.
//
// Public lists (/l/[slug]) are deliberately absent: there is no
// enumeration query (slug-keyed, service-role only) and owners can flip
// them private at any time, which would rot the sitemap. Their share
// links carry full OG metadata instead.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
  const { data } = await supabase
    .from("places")
    .select("id, updated_at")
    .eq("status", "published");

  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/map`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/search`, changeFrequency: "weekly", priority: 0.5 },
    ...(data ?? []).map((p) => ({
      url: `${SITE_URL}/place/${p.id}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
