import { z } from "zod";

// Coerce common string booleans ("true"/"false") into real booleans safely.
const booleanish = z
  .preprocess((v) => {
    if (typeof v === "string") return v.toLowerCase() === "true";
    return v;
  }, z.boolean())
  .default(false);

const MAX_TEXT = 200_000;

export const verseSchema = z.object({
  content: z.string().max(MAX_TEXT),
});

export const slideSchema = z.object({
  title: z.string().max(500),
  verses: z.array(verseSchema).max(1000),
});

export const slidesSchema = z.array(slideSchema).min(1, "At least one slide is required.").max(2000);

export const lookupSchema = z
  .object({
    references: z.array(z.string().max(200)).max(1000).optional(),
    text: z.string().max(MAX_TEXT).optional(),
    source: z.enum(["offline", "online"]).default("offline"),
    version: z.string().max(20).default("NKJV"),
  })
  .refine(
    (d) => (d.references && d.references.length > 0) || (d.text && d.text.trim().length > 0),
    { message: "Provide either 'references' (array) or 'text' (string)." },
  );

export const lyricsContentSchema = z.object({
  content: z.string().min(1, "Lyrics content is required.").max(MAX_TEXT),
});

export const lyricsPp7Schema = z.object({
  content: z.string().min(1, "Lyrics content is required.").max(MAX_TEXT),
  useTheme: booleanish,
});

export const sermonPptSchema = z.object({
  slides: slidesSchema,
  pastorId: z.coerce.number().int().positive().optional(),
  sermonTitle: z.string().max(500).optional(),
});

export const sermonPp7Schema = z.object({
  slides: slidesSchema,
  pastorId: z.coerce.number().int().positive().optional(),
  useTheme: booleanish,
});
