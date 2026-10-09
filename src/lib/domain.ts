import type { ArticleEditorial } from "./article-content";
export type Locale = "en" | "fa";
export type Localized = Record<Locale, string>;
export type Role = "USER" | "ADMIN";
export type LeadStatus =
  "new" | "contacted" | "qualified" | "converted" | "closed";
export type ProjectStatus =
  "planning" | "active" | "review" | "completed" | "paused";

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  service: string;
  budget: string;
  message: string;
  preferredLanguage: Locale;
  contactMethod: "email" | "phone";
  status: LeadStatus;
  notes: string;
  createdAt: string;
}
export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  emailVerified: boolean;
  company: string;
  phone: string;
  locale: Locale;
}
export interface Milestone {
  id: string;
  title: Localized;
  completed: boolean;
}
export interface Deliverable {
  id: string;
  projectId: string;
  title: Localized;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
  isDemo: boolean;
}
export interface Project {
  id: string;
  clientId: string;
  clientName: string;
  title: Localized;
  description: Localized;
  serviceIds: string[];
  status: ProjectStatus;
  progress: number;
  stage: Localized;
  startDate: string;
  deadline: string;
  notes: string;
  milestones: Milestone[];
  deliverables: Deliverable[];
  createdAt: string;
  updatedAt: string;
  isDemo: boolean;
}
export interface ClientService {
  id: string;
  userId: string;
  serviceSlug: string;
  package: Localized;
  status: "active" | "completed" | "paused";
  startDate: string;
  endDate: string;
  progress: number;
  team: string;
  latestUpdate: Localized;
  isDemo: boolean;
}
export interface Report {
  id: string;
  userId: string;
  projectId: string;
  title: Localized;
  category: string;
  period: string;
  summary: Localized;
  metrics: { label: Localized; value: string }[];
  createdAt: string;
  isDemo: boolean;
}
export interface Notification {
  id: string;
  userId: string;
  title: Localized;
  message: Localized;
  createdAt: string;
  read: boolean;
}
export interface BlogPost {
  primaryLanguage: Locale | null;
  editorial: ArticleEditorial;
  id: string;
  slug: string;
  title: Localized;
  excerpt: Localized;
  content: Localized;
  category: Localized;
  author: string;
  cover: string;
  published: boolean;
  publishedAt: string | null;
  seoTitle: Localized;
  seoDescription: Localized;
  createdAt: string;
  updatedAt: string;
  isDemo: boolean;
}
export interface PortfolioProject {
  id: string;
  slug: string;
  title: Localized;
  client: string;
  industry: Localized;
  services: string[];
  cover: string;
  gallery: string[];
  challenge: Localized;
  approach: Localized;
  solution: Localized;
  result: Localized;
  date: string;
  isDemo: boolean;
}
export interface ServiceSetting {
  slug: string;
  visible: boolean;
  sortOrder: number;
}
