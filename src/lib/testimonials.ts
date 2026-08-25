import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import { testimonials } from "./db/schema";
import type { DbTestimonial } from "./db/schema";

/**
 * Third-party references.
 *
 * Follows the same shape as src/lib/projects.ts: a Zod input schema so the API
 * validates before it writes, a public reader that never returns drafts, and an
 * admin reader that returns everything.
 */

export const testimonialInputSchema = z.object({
  quote: z.string().min(10, "A one-word quote is not a reference"),
  author: z.string().min(1),
  role: z.string().min(1),
  company: z.string().min(1),
  sourceUrl: z.union([z.string().url(), z.literal("")]).nullable().default(null),
  draft: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export type TestimonialInput = z.infer<typeof testimonialInputSchema>;
export type Testimonial = DbTestimonial;

/** Public. Never returns drafts. */
export async function getTestimonials(): Promise<Testimonial[]> {
  if (!db) return [];
  try {
    return await db
      .select()
      .from(testimonials)
      .where(eq(testimonials.draft, false))
      .orderBy(asc(testimonials.sortOrder), asc(testimonials.createdAt));
  } catch {
    // A missing table must not take the homepage down — the section has an
    // honest empty state and this is the path that reaches it.
    return [];
  }
}

/** Admin. Returns drafts too. */
export async function listTestimonialsForAdmin(): Promise<Testimonial[]> {
  if (!db) return [];
  return db
    .select()
    .from(testimonials)
    .orderBy(asc(testimonials.sortOrder), asc(testimonials.createdAt));
}

export async function createTestimonial(
  input: TestimonialInput
): Promise<Testimonial> {
  if (!db) throw new Error("DATABASE_URL is not configured.");
  const rows = await db
    .insert(testimonials)
    .values({ ...input, sourceUrl: input.sourceUrl || null })
    .returning();
  return rows[0];
}

export async function updateTestimonial(
  id: number,
  input: Partial<TestimonialInput>
): Promise<Testimonial | null> {
  if (!db) throw new Error("DATABASE_URL is not configured.");
  const rows = await db
    .update(testimonials)
    .set({
      ...input,
      ...(input.sourceUrl !== undefined
        ? { sourceUrl: input.sourceUrl || null }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(testimonials.id, id))
    .returning();
  return rows[0] ?? null;
}

export async function deleteTestimonial(id: number): Promise<boolean> {
  if (!db) throw new Error("DATABASE_URL is not configured.");
  const rows = await db
    .delete(testimonials)
    .where(eq(testimonials.id, id))
    .returning();
  return rows.length > 0;
}
