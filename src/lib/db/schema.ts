import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  slug: text("slug").unique().notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  content: text("content").notNull().default(""),
  category: text("category").notNull().default("General"),
  tags: text("tags").array().notNull().default([]),
  draft: boolean("draft").notNull().default(false),
  publishedAt: timestamp("published_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export type DbPost = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
