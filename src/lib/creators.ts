// Gobble Maps — the two people behind the app. Single source of truth,
// imported by the credits sheet/line (client), the public-list footer and
// the JSON-LD author tags (server). Pure data: no server/client directive.

export interface Creator {
  name: string;
  /** Avatar monogram. */
  initial: string;
  role: string;
  blurb: string;
  /** Instagram handle without the leading @. */
  instagram: string;
  instagramUrl: string;
  /** Display label + URL for a personal site (Nakul only). */
  website?: string;
  websiteUrl?: string;
}

// Tirth first to match the brand line "Curated by … · Built by …".
export const CURATOR: Creator = {
  name: "Tirth Shah",
  initial: "T",
  role: "Curator",
  blurb: "The idea, and every place — handpicked.",
  instagram: "tirthshah___",
  instagramUrl: "https://instagram.com/tirthshah___",
};

export const MAKER: Creator = {
  name: "Nakul Jhunjhunwala",
  initial: "N",
  role: "Maker",
  blurb: "Designed & built Gobble Maps.",
  instagram: "nakuljhunjhunwala",
  instagramUrl: "https://instagram.com/nakuljhunjhunwala",
  website: "nakuljhunjhunwala.in",
  websiteUrl: "https://nakuljhunjhunwala.in",
};

export const CREATORS: Creator[] = [CURATOR, MAKER];
