"use client";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import type { PortfolioProject } from "@/lib/domain";
import { dashboardMessages } from "@/content/dashboard-messages";
import {
  Field,
  FormControls,
  MutationFeedback,
  SaveButton,
  useMutation,
} from "./forms";

const labels = {
  en: {
    industry: "Industry",
    challenge: "Challenge",
    approach: "Approach",
    solution: "Solution",
    result: "Result",
    gallery: "Gallery image paths (one per line)",
    date: "Project date",
    coverHint: "Use an existing image from /images/.",
    selectService: "Choose at least one service.",
  },
  fa: {
    industry: "صنعت",
    challenge: "چالش",
    approach: "رویکرد",
    solution: "راه‌حل",
    result: "نتیجه",
    gallery: "نشانی تصاویر گالری (هر تصویر در یک خط)",
    date: "تاریخ پروژه",
    coverHint: "از تصاویر موجود در مسیر /images/ استفاده کنید.",
    selectService: "حداقل یک خدمت انتخاب کنید.",
  },
};
export function PortfolioEditor({
  project,
  locale,
  services,
}: {
  project?: PortfolioProject;
  locale: Locale;
  services: { slug: string; title: string }[];
}) {
  const t = dashboardMessages(locale);
  const l = labels[locale];
  const mutation = useMutation(locale);
  const router = useRouter();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (!data.getAll("services").length) {
      mutation.setFeedback({ type: "error", message: l.selectService });
      return;
    }
    const localized = (key: string) => ({
      en: String(data.get(`${key}En`) ?? ""),
      fa: String(data.get(`${key}Fa`) ?? ""),
    });
    const body = {
      slug: data.get("slug"),
      title: localized("title"),
      client: data.get("client"),
      industry: localized("industry"),
      services: data.getAll("services"),
      cover: data.get("cover"),
      gallery: String(data.get("gallery") ?? "")
        .split("\n")
        .map((value) => value.trim())
        .filter(Boolean),
      challenge: localized("challenge"),
      approach: localized("approach"),
      solution: localized("solution"),
      result: localized("result"),
      date: data.get("date"),
    };
    const ok = await mutation.mutate(
      project ? `/api/admin/portfolio/${project.id}` : "/api/admin/portfolio",
      body,
      project ? "PATCH" : "POST",
    );
    if (ok && !project) router.push(`/${locale}/admin/portfolio`);
  }
  return (
    <form onSubmit={submit} className="workspace-form">
      <FormControls pending={mutation.pending}>
        <div className="workspace-form-grid">
          <Field label={t.titleEn}>
            <input
              required
              name="titleEn"
              maxLength={300}
              defaultValue={project?.title.en}
              dir="ltr"
            />
          </Field>
          <Field label={t.titleFa}>
            <input
              required
              name="titleFa"
              maxLength={300}
              defaultValue={project?.title.fa}
              dir="rtl"
            />
          </Field>
          <Field label={t.slug}>
            <input
              name="slug"
              required
              minLength={3}
              maxLength={150}
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              defaultValue={project?.slug}
              dir="ltr"
            />
          </Field>
          <Field label={t.client}>
            <input
              required
              name="client"
              maxLength={150}
              defaultValue={project?.client}
            />
          </Field>
          <Field label={`${l.industry} · English`}>
            <input
              required
              name="industryEn"
              maxLength={300}
              defaultValue={project?.industry.en}
              dir="ltr"
            />
          </Field>
          <Field label={`${l.industry} · فارسی`}>
            <input
              required
              name="industryFa"
              maxLength={300}
              defaultValue={project?.industry.fa}
              dir="rtl"
            />
          </Field>
          {(["challenge", "approach", "solution", "result"] as const).flatMap(
            (key) => [
              <Field key={`${key}En`} label={`${l[key]} · English`}>
                <textarea
                  name={`${key}En`}
                  required
                  rows={4}
                  maxLength={20000}
                  defaultValue={project?.[key].en}
                  dir="ltr"
                />
              </Field>,
              <Field key={`${key}Fa`} label={`${l[key]} · فارسی`}>
                <textarea
                  name={`${key}Fa`}
                  required
                  rows={4}
                  maxLength={20000}
                  defaultValue={project?.[key].fa}
                  dir="rtl"
                />
              </Field>,
            ],
          )}
          <Field label={t.cover} hint={l.coverHint}>
            <input
              name="cover"
              maxLength={300}
              defaultValue={project?.cover}
              dir="ltr"
            />
          </Field>
          <Field label={l.date}>
            <input
              name="date"
              required
              type="date"
              defaultValue={project?.date.slice(0, 10)}
            />
          </Field>
          <Field label={l.gallery}>
            <textarea
              name="gallery"
              rows={3}
              defaultValue={project?.gallery.join("\n")}
              dir="ltr"
            />
          </Field>
        </div>
        <fieldset className="workspace-fieldset">
          <legend>{t.services}</legend>
          <div className="workspace-check-options">
            {services.map((service) => (
              <label key={service.slug} className="workspace-checkbox">
                <input
                  type="checkbox"
                  name="services"
                  value={service.slug}
                  defaultChecked={project?.services.includes(service.slug)}
                />
                <span>{service.title}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <MutationFeedback feedback={mutation.feedback} />
        <SaveButton pending={mutation.pending} locale={locale} />
      </FormControls>
    </form>
  );
}
export function DeliverableEditor({
  projectId,
  locale,
}: {
  projectId: string;
  locale: Locale;
}) {
  const t = dashboardMessages(locale);
  const mutation = useMutation(locale);
  const l = {
    en: {
      filename: "File name (.txt, .csv, or .md)",
      content: "File contents",
      add: "Add deliverable",
    },
    fa: {
      filename: "نام فایل (با پسوند txt، csv یا md)",
      content: "محتوای فایل",
      add: "افزودن خروجی",
    },
  }[locale];
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const ok = await mutation.mutate(
      `/api/admin/projects/${projectId}/deliverables`,
      {
        title: { en: data.get("titleEn"), fa: data.get("titleFa") },
        filename: data.get("filename"),
        content: data.get("content"),
      },
      "POST",
    );
    if (ok) form.reset();
  }
  return (
    <form className="workspace-form" onSubmit={submit}>
      <FormControls pending={mutation.pending}>
        <div className="workspace-form-grid">
          <Field label={t.titleEn}>
            <input name="titleEn" required maxLength={300} dir="ltr" />
          </Field>
          <Field label={t.titleFa}>
            <input name="titleFa" required maxLength={300} dir="rtl" />
          </Field>
        </div>
        <Field label={l.filename}>
          <input
            name="filename"
            required
            maxLength={105}
            pattern="[a-zA-Z0-9][a-zA-Z0-9_.\-]*\.(txt|csv|md)"
            placeholder="project-brief.txt"
            dir="ltr"
          />
        </Field>
        <Field label={l.content}>
          <textarea name="content" required maxLength={200000} rows={6} />
        </Field>
        <MutationFeedback feedback={mutation.feedback} />
        <SaveButton pending={mutation.pending} locale={locale}>
          {l.add}
        </SaveButton>
      </FormControls>
    </form>
  );
}
