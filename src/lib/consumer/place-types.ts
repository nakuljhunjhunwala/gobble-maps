// Gobble Maps consumer — place type definitions (ported from
// design/gobble/data.js GOBBLE_TYPES), typed against the Icon set.

import type { IconName } from "@/components/icons";
import type { PlaceType } from "@/lib/types";

export interface GobbleTypeDef {
  icon: IconName;
  label: string;
}

export const GOBBLE_TYPES: Record<PlaceType, GobbleTypeDef> = {
  restaurant: { icon: "fork", label: "Restaurant" },
  cafe: { icon: "coffee", label: "Café" },
  club: { icon: "cocktail", label: "Club / Bar" },
  bakery: { icon: "cake", label: "Bakery / Dessert" },
  street: { icon: "cart", label: "Street Food Stall" },
  brewery: { icon: "beer", label: "Brewery" },
};

export const PLACE_TYPE_KEYS = Object.keys(GOBBLE_TYPES) as PlaceType[];
