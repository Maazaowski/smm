import { z } from "zod";

export const certificateSchema = z.object({
  title: z.string().min(1),
  issuer: z.string().min(1),
  url: z.string().url(),
  issuedAt: z.string().optional(),
});

export const timelineEntrySchema = z.object({
  period: z.string().min(1),
  role: z.string().min(1),
  company: z.string().min(1),
  location: z.string().optional(),
  highlights: z.array(z.string().min(1)),
});

export const aboutContentSchema = z.object({
  bio: z.array(z.string().min(1)).min(1),
  availability: z.object({
    label: z.string().min(1),
    message: z.string().min(1),
  }),
  education: z.object({
    degree: z.string().min(1),
    institution: z.string().min(1),
    location: z.string().min(1),
    period: z.string().min(1),
    gpa: z.string().optional(),
  }),
  timeline: z.array(timelineEntrySchema),
  skills: z.record(z.string(), z.array(z.string().min(1))),
  certificates: z.array(certificateSchema),
});

export type Certificate = z.infer<typeof certificateSchema>;
export type TimelineEntry = z.infer<typeof timelineEntrySchema>;
export type AboutContent = z.infer<typeof aboutContentSchema>;
