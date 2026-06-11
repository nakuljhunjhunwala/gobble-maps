import { z } from "zod";

// ── Login ────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ── Place editor ─────────────────────────────────────────────

const dayHoursSchema = z
  .object({
    open: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM format."),
    close: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM format."),
  })
  .nullable();

export const hoursSchema = z.record(
  z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]),
  dayHoursSchema
);

const ratingSchema = z.number().min(1).max(5).nullable().optional();

export const placeSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required.").max(120),
    type: z.enum([
      "restaurant",
      "cafe",
      "club",
      "bakery",
      "street",
      "brewery",
    ]),
    budget: z.number().int().min(1).max(5),
    areaId: z.uuid().nullable().optional(),
    station: z.string().trim().max(120).optional().default(""),
    address: z.string().trim().max(300).optional().default(""),
    lat: z.number().min(-90).max(90).nullable().optional(),
    lng: z.number().min(-180).max(180).nullable().optional(),
    phone: z.string().trim().max(30).optional().default(""),
    instagram: z.string().trim().max(80).optional().default(""),
    website: z.string().trim().max(300).optional().default(""),
    hours: hoursSchema,
    meals: z
      .array(z.enum(["breakfast", "lunch", "dinner", "brunch", "party"]))
      .default([]),
    // Cuisine + vibe tag ids (filter_options)
    tagIds: z.array(z.uuid()).default([]),
    visited: z.boolean().default(false),
    // Only meaningful when visited
    foodRating: ratingSchema,
    serviceRating: ratingSchema,
    ambienceRating: ratingSchema,
    mustTry: z.array(z.string().trim().min(1).max(120)).default([]),
    curatorNote: z.string().trim().max(2000).optional().default(""),
    bestTime: z.string().trim().max(200).optional().default(""),
    liveMusic: z.boolean().default(false),
    boardGames: z.boolean().default(false),
    pureVeg: z.boolean().default(false),
    intendedStatus: z.enum(["draft", "published", "permanently_closed"]),
    // Number of photos currently uploaded for this place
    photoCount: z.number().int().min(0).max(6),
  })
  .superRefine((val, ctx) => {
    if (val.intendedStatus === "published" && val.photoCount < 4) {
      ctx.addIssue({
        code: "custom",
        path: ["photoCount"],
        message: "Please upload at least 4 photos before publishing.",
      });
    }
  });

export type PlaceInput = z.infer<typeof placeSchema>;

// ── Filters & categories ─────────────────────────────────────

export const filterOptionSchema = z.object({
  id: z.uuid().optional(),
  category: z.enum(["cuisine", "vibe", "area"]),
  label: z.string().trim().min(1, "Label is required.").max(80),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type FilterOptionInput = z.infer<typeof filterOptionSchema>;

// ── Notifications ────────────────────────────────────────────

export const notificationSchema = z
  .object({
    message: z
      .string()
      .trim()
      .min(1, "Message is required.")
      .max(500, "Message must be 500 characters or fewer."),
    segment: z.enum(["all", "area"]),
    areaId: z.uuid().optional(),
    scheduledFor: z.iso.datetime({ offset: true }).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.segment === "area" && !val.areaId) {
      ctx.addIssue({
        code: "custom",
        path: ["areaId"],
        message: "Pick an area for an area-based notification.",
      });
    }
  });

export type NotificationInput = z.infer<typeof notificationSchema>;

// ── To Be Tried ──────────────────────────────────────────────

export const tbtSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(1, "Name is required.").max(120),
  address: z.string().trim().max(300).optional().default(""),
  notes: z.string().trim().max(2000).optional().default(""),
  status: z.enum(["pending_visit", "visited"]).optional(),
});

export type TbtInput = z.infer<typeof tbtSchema>;
