import { z } from "zod";
import { articleImageSchema, editorialSchema } from "./article-content";

export const serviceIds = [
  "digital-marketing",
  "instagram-marketing",
  "social-media",
  "seo",
  "web-development",
  "wordpress",
  "video-editing",
  "videography",
  "photography",
] as const;
export const localizedSchema = z
  .object({
    en: z.string().trim().min(1).max(20000),
    fa: z.string().trim().min(1).max(20000),
  })
  .strict();
const localizedShort = z
  .object({
    en: z.string().trim().min(1).max(300),
    fa: z.string().trim().min(1).max(300),
  })
  .strict();
export const leadSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z.union([z.email().max(254), z.literal("")]).default(""),
    phone: z
      .string()
      .trim()
      .max(40)
      .regex(/^[+\d\s().-]*$/)
      .default(""),
    company: z.string().trim().max(150).default(""),
    service: z.enum(serviceIds),
    budget: z.string().trim().max(80).default(""),
    message: z.string().trim().min(20).max(5000),
    preferredLanguage: z.enum(["en", "fa"]).default("en"),
    contactMethod: z.enum(["email", "phone"]).default("email"),
    website: z.string().max(0).optional(),
  })
  .strict()
  .superRefine((data, context) => {
    if (data.contactMethod === "email" && !data.email)
      context.addIssue({
        code: "custom",
        path: ["email"],
        message: "Email is required.",
      });
    if (
      data.contactMethod === "phone" &&
      data.phone.replace(/\D/g, "").length < 7
    )
      context.addIssue({
        code: "custom",
        path: ["phone"],
        message: "Enter a valid phone number.",
      });
  });
export const leadUpdateSchema = z
  .object({
    status: z.enum(["new", "contacted", "qualified", "converted", "closed"]),
    notes: z.string().trim().max(5000).default(""),
  })
  .strict();
export const profileSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    company: z.string().trim().max(150).default(""),
    phone: z.string().trim().max(40).default(""),
    locale: z.enum(["en", "fa"]).default("en"),
  })
  .strict();
const localImage = z
  .string()
  .max(300)
  .refine(
    (value) =>
      !value ||
      (/^\/images\/[a-zA-Z0-9_./-]+$/.test(value) && !value.includes("..")),
    "Use an image from /images/.",
  );
const articleLocalized = (max: number) =>
  z
    .object({ en: z.string().trim().max(max), fa: z.string().trim().max(max) })
    .strict();
export const blogSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .min(3)
      .max(150)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: articleLocalized(300),
    excerpt: articleLocalized(1000),
    content: articleLocalized(200000),
    category: articleLocalized(100),
    author: z.string().trim().min(2).max(100),
    cover: articleImageSchema.default(""),
    published: z.boolean().default(false),
    seoTitle: articleLocalized(200),
    seoDescription: articleLocalized(500),
    primaryLanguage: z.enum(["en", "fa"]).nullable().default(null),
    editorial: editorialSchema.default({
      languageMode: "manual",
      unpublished: false,
    }),
  })
  .strict();
export const blogUpdateSchema = blogSchema
  .partial()
  .extend({ expectedUpdatedAt: z.iso.datetime().optional() })
  .strict();
export const milestoneSchema = z
  .object({
    id: z.string().min(1).max(100),
    title: localizedShort,
    completed: z.boolean(),
  })
  .strict();
export const projectSchema = z
  .object({
    clientId: z.string().min(1).max(100),
    title: localizedShort,
    description: localizedSchema,
    serviceIds: z.array(z.enum(serviceIds)).min(1).max(9),
    status: z
      .enum(["planning", "active", "review", "completed", "paused"])
      .default("planning"),
    progress: z.number().int().min(0).max(100).default(0),
    stage: localizedShort,
    startDate: z.iso.date(),
    deadline: z.iso.date(),
    notes: z.string().max(10000).default(""),
    milestones: z.array(milestoneSchema).max(30).default([]),
  })
  .strict();
export const projectUpdateSchema = projectSchema.partial();
export const serviceSettingSchema = z
  .object({ visible: z.boolean(), sortOrder: z.number().int().min(0).max(100) })
  .strict();
export const serviceAssignmentSchema = z
  .object({
    serviceSlug: z.enum(serviceIds),
    package: localizedShort,
    status: z.enum(["active", "completed", "paused"]),
    startDate: z.iso.date(),
    endDate: z.iso.date(),
    progress: z.number().int().min(0).max(100),
    team: z.string().trim().min(1).max(150),
    latestUpdate: localizedSchema,
  })
  .strict();
export const serviceAssignmentUpdateSchema = serviceAssignmentSchema.partial();
export const deliverableSchema = z
  .object({
    title: localizedShort,
    filename: z
      .string()
      .regex(/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,100}\.(txt|csv|md)$/),
    content: z.string().min(1).max(200000),
  })
  .strict();
export const portfolioSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .min(3)
      .max(150)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: localizedShort,
    client: z.string().trim().min(1).max(150),
    industry: localizedShort,
    services: z.array(z.enum(serviceIds)).min(1).max(9),
    cover: localImage.default(""),
    gallery: z.array(localImage).max(12).default([]),
    challenge: localizedSchema,
    approach: localizedSchema,
    solution: localizedSchema,
    result: localizedSchema,
    date: z.iso.date(),
  })
  .strict();
export type LeadInput = z.infer<typeof leadSchema>;
export type BlogInput = z.infer<typeof blogSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type PortfolioInput = z.infer<typeof portfolioSchema>;
export type ServiceAssignmentInput = z.infer<typeof serviceAssignmentSchema>;
