import { eq } from "drizzle-orm";
import { db } from "./db";
import { aboutPage } from "./db/schema";
import { DEFAULT_ABOUT_CONTENT } from "./about-defaults";
import type { AboutContent } from "./about-types";

export interface AboutPageData {
  content: AboutContent;
  updatedAt: Date | null;
  source: "database" | "defaults";
}

async function readAboutRow() {
  if (!db) return null;
  try {
    const rows = await db.select().from(aboutPage).limit(1);
    return rows[0] ?? null;
  } catch (err) {
    console.error("[about] Failed to read about_page:", err);
    return null;
  }
}

export async function getAboutContent(): Promise<AboutPageData> {
  const row = await readAboutRow();
  if (row) {
    return {
      content: row.content,
      updatedAt: row.updatedAt,
      source: "database",
    };
  }

  return {
    content: DEFAULT_ABOUT_CONTENT,
    updatedAt: null,
    source: "defaults",
  };
}

export async function seedAboutContent(): Promise<AboutPageData> {
  if (!db) {
    return {
      content: DEFAULT_ABOUT_CONTENT,
      updatedAt: null,
      source: "defaults",
    };
  }

  try {
    const existing = await readAboutRow();
    if (existing) {
      return {
        content: existing.content,
        updatedAt: existing.updatedAt,
        source: "database",
      };
    }

    const rows = await db
      .insert(aboutPage)
      .values({
        content: DEFAULT_ABOUT_CONTENT,
        updatedAt: new Date(),
      })
      .returning();

    return {
      content: rows[0].content,
      updatedAt: rows[0].updatedAt,
      source: "database",
    };
  } catch (err) {
    console.error("[about] Failed to seed about_page:", err);
    return {
      content: DEFAULT_ABOUT_CONTENT,
      updatedAt: null,
      source: "defaults",
    };
  }
}

export async function updateAboutContent(
  content: AboutContent
): Promise<AboutPageData> {
  if (!db) throw new Error("DATABASE_URL is not configured.");

  const existing = await readAboutRow();
  const now = new Date();

  if (existing) {
    const rows = await db
      .update(aboutPage)
      .set({ content, updatedAt: now })
      .where(eq(aboutPage.id, existing.id))
      .returning();

    return {
      content: rows[0].content,
      updatedAt: rows[0].updatedAt,
      source: "database",
    };
  }

  const rows = await db
    .insert(aboutPage)
    .values({ content, updatedAt: now })
    .returning();

  return {
    content: rows[0].content,
    updatedAt: rows[0].updatedAt,
    source: "database",
  };
}
