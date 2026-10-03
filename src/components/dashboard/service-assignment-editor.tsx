"use client";

import { useState, type FormEvent } from "react";
import type { Locale } from "@/lib/i18n";
import type { ClientService } from "@/lib/domain";
import { dashboardMessages, statusLabel } from "@/content/dashboard-messages";
import {
  Field,
  FormControls,
  MutationFeedback,
  SaveButton,
  useMutation,
} from "./forms";

const labels = {
  en: {
    assign: "Assign a service",
    packageEn: "Package · English",
    packageFa: "Package · فارسی",
    team: "Assigned team",
    updateEn: "Latest update · English",
    updateFa: "Latest update · فارسی",
    endDate: "End date",
    intro:
      "Create a service engagement for this customer. It will appear immediately in their workspace.",
    dateError: "The end date must be on or after the start date.",
  },
  fa: {
    assign: "اختصاص خدمت",
    packageEn: "بسته خدمات · انگلیسی",
    packageFa: "بسته خدمات · فارسی",
    team: "تیم مسئول",
    updateEn: "آخرین به‌روزرسانی · انگلیسی",
    updateFa: "آخرین به‌روزرسانی · فارسی",
    endDate: "تاریخ پایان",
    intro:
      "یک همکاری خدماتی برای این مشتری تعریف کنید تا در فضای کاری او نمایش داده شود.",
    dateError: "تاریخ پایان باید برابر با تاریخ شروع یا پس از آن باشد.",
  },
};
export function ServiceAssignments({
  userId,
  assignments,
  services,
  locale,
}: {
  userId: string;
  assignments: ClientService[];
  services: { slug: string; title: string }[];
  locale: Locale;
}) {
  const t = dashboardMessages(locale);
  const l = labels[locale];
  const [adding, setAdding] = useState(false);
  const [created, setCreated] = useState(false);
  return (
    <div className="workspace-assignments">
      {created && (
        <p className="workspace-form-feedback success" role="status">
          {t.saved}
        </p>
      )}
      {assignments.map((service) => (
        <details key={service.id} className="workspace-assignment">
          <summary>
            <span>
              <strong>
                {services.find((option) => option.slug === service.serviceSlug)
                  ?.title ?? service.serviceSlug}
              </strong>
              <small>{service.package[locale]}</small>
            </span>
            <span>
              {statusLabel(service.status, locale)} · {t.edit}
            </span>
          </summary>
          <ServiceAssignmentEditor
            userId={userId}
            service={service}
            services={services}
            locale={locale}
          />
        </details>
      ))}
      {adding ? (
        <div className="workspace-assignment-new">
          <p>{l.intro}</p>
          <ServiceAssignmentEditor
            userId={userId}
            services={services}
            locale={locale}
            onCreated={() => {
              setAdding(false);
              setCreated(true);
            }}
          />
          <button
            className="workspace-button"
            type="button"
            onClick={() => setAdding(false)}
          >
            {t.cancel}
          </button>
        </div>
      ) : (
        <button
          className="workspace-button"
          type="button"
          onClick={() => {
            setAdding(true);
            setCreated(false);
          }}
        >
          + {l.assign}
        </button>
      )}
    </div>
  );
}
function ServiceAssignmentEditor({
  userId,
  service,
  services,
  locale,
  onCreated,
}: {
  userId: string;
  service?: ClientService;
  services: { slug: string; title: string }[];
  locale: Locale;
  onCreated?: () => void;
}) {
  const t = dashboardMessages(locale);
  const l = labels[locale];
  const mutation = useMutation(locale);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (String(data.get("endDate")) < String(data.get("startDate"))) {
      mutation.setFeedback({ type: "error", message: l.dateError });
      return;
    }
    const body = {
      serviceSlug: data.get("serviceSlug"),
      package: { en: data.get("packageEn"), fa: data.get("packageFa") },
      status: data.get("status"),
      startDate: data.get("startDate"),
      endDate: data.get("endDate"),
      progress: Number(data.get("progress")),
      team: data.get("team"),
      latestUpdate: { en: data.get("updateEn"), fa: data.get("updateFa") },
    };
    const ok = await mutation.mutate(
      `/api/admin/users/${userId}/services${service ? `/${service.id}` : ""}`,
      body,
      service ? "PATCH" : "POST",
    );
    if (ok && !service) onCreated?.();
  }
  return (
    <form className="workspace-form" onSubmit={submit}>
      <FormControls pending={mutation.pending}>
        <div className="workspace-form-grid">
          <Field label={t.service}>
            <select
              name="serviceSlug"
              required
              defaultValue={service?.serviceSlug ?? services[0]?.slug}
            >
              {services.map((option) => (
                <option key={option.slug} value={option.slug}>
                  {option.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t.status}>
            <select name="status" defaultValue={service?.status ?? "active"}>
              {["active", "paused", "completed"].map((status) => (
                <option key={status} value={status}>
                  {statusLabel(status, locale)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={l.packageEn}>
            <input
              name="packageEn"
              required
              maxLength={300}
              defaultValue={service?.package.en}
              dir="ltr"
            />
          </Field>
          <Field label={l.packageFa}>
            <input
              name="packageFa"
              required
              maxLength={300}
              defaultValue={service?.package.fa}
              dir="rtl"
            />
          </Field>
          <Field label={t.startDate}>
            <input
              name="startDate"
              required
              type="date"
              defaultValue={service?.startDate}
            />
          </Field>
          <Field label={l.endDate}>
            <input
              name="endDate"
              required
              type="date"
              defaultValue={service?.endDate}
            />
          </Field>
          <Field label={t.progress}>
            <input
              name="progress"
              required
              type="number"
              min={0}
              max={100}
              defaultValue={service?.progress ?? 0}
            />
          </Field>
          <Field label={l.team}>
            <input
              name="team"
              required
              maxLength={150}
              defaultValue={service?.team ?? "Salsal"}
            />
          </Field>
          <Field label={l.updateEn}>
            <textarea
              name="updateEn"
              required
              maxLength={20000}
              rows={3}
              defaultValue={service?.latestUpdate.en}
              dir="ltr"
            />
          </Field>
          <Field label={l.updateFa}>
            <textarea
              name="updateFa"
              required
              maxLength={20000}
              rows={3}
              defaultValue={service?.latestUpdate.fa}
              dir="rtl"
            />
          </Field>
        </div>
        <MutationFeedback feedback={mutation.feedback} />
        <SaveButton pending={mutation.pending} locale={locale}>
          {service ? t.save : l.assign}
        </SaveButton>
      </FormControls>
    </form>
  );
}
