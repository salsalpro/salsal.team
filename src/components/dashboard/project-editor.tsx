"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { Project, UserSummary, Milestone } from "@/lib/domain";
import { dashboardMessages, statusLabel } from "@/content/dashboard-messages";
import {
  Field,
  FormControls,
  MutationFeedback,
  SaveButton,
  useMutation,
} from "./forms";

type ServiceOption = { slug: string; title: string };
export function ProjectEditor({
  project,
  clients,
  services,
  locale,
}: {
  project?: Project;
  clients: UserSummary[];
  services: ServiceOption[];
  locale: Locale;
}) {
  const t = dashboardMessages(locale);
  const router = useRouter();
  const mutation = useMutation(locale);
  const [milestones, setMilestones] = useState<Milestone[]>(
    project?.milestones ?? [],
  );
  function changeMilestone(
    id: string,
    field: "en" | "fa" | "completed",
    value: string | boolean,
  ) {
    setMilestones((items) =>
      items.map((item) =>
        item.id !== id
          ? item
          : field === "completed"
            ? { ...item, completed: Boolean(value) }
            : { ...item, title: { ...item.title, [field]: String(value) } },
      ),
    );
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (!data.getAll("serviceIds").length) {
      mutation.setFeedback({
        type: "error",
        message:
          locale === "fa"
            ? "حداقل یک خدمت انتخاب کنید."
            : "Choose at least one service.",
      });
      return;
    }
    const body = {
      clientId: data.get("clientId"),
      title: { en: data.get("titleEn"), fa: data.get("titleFa") },
      description: {
        en: data.get("descriptionEn"),
        fa: data.get("descriptionFa"),
      },
      stage: { en: data.get("stageEn"), fa: data.get("stageFa") },
      serviceIds: data.getAll("serviceIds"),
      status: data.get("status"),
      progress: Number(data.get("progress")),
      startDate: data.get("startDate"),
      deadline: data.get("deadline"),
      notes: data.get("notes"),
      milestones,
    };
    const ok = await mutation.mutate(
      project ? `/api/admin/projects/${project.id}` : "/api/admin/projects",
      body,
      project ? "PATCH" : "POST",
    );
    if (ok && !project) router.push(`/${locale}/admin/projects`);
  }
  return (
    <form onSubmit={submit} className="workspace-form">
      <FormControls pending={mutation.pending}>
        <div className="workspace-form-grid">
          <Field label={t.titleEn}>
            <input
              required
              name="titleEn"
              maxLength={200}
              defaultValue={project?.title.en}
              dir="ltr"
            />
          </Field>
          <Field label={t.titleFa}>
            <input
              required
              name="titleFa"
              maxLength={200}
              defaultValue={project?.title.fa}
              dir="rtl"
            />
          </Field>
          <Field label={t.descriptionEn}>
            <textarea
              name="descriptionEn"
              required
              rows={3}
              maxLength={10000}
              defaultValue={project?.description.en}
              dir="ltr"
            />
          </Field>
          <Field label={t.descriptionFa}>
            <textarea
              name="descriptionFa"
              required
              rows={3}
              maxLength={10000}
              defaultValue={project?.description.fa}
              dir="rtl"
            />
          </Field>
          <Field label={t.client}>
            <select
              name="clientId"
              required
              defaultValue={project?.clientId ?? ""}
            >
              <option value="" disabled>
                {t.selectClient}
              </option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} · {client.email}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t.status}>
            <select name="status" defaultValue={project?.status ?? "planning"}>
              {["planning", "active", "review", "completed", "paused"].map(
                (status) => (
                  <option value={status} key={status}>
                    {statusLabel(status, locale)}
                  </option>
                ),
              )}
            </select>
          </Field>
          <Field label={t.stageEn}>
            <input
              name="stageEn"
              required
              maxLength={200}
              defaultValue={project?.stage.en}
              dir="ltr"
            />
          </Field>
          <Field label={t.stageFa}>
            <input
              name="stageFa"
              required
              maxLength={200}
              defaultValue={project?.stage.fa}
              dir="rtl"
            />
          </Field>
          <Field label={t.startDate}>
            <input
              name="startDate"
              required
              type="date"
              defaultValue={project?.startDate.slice(0, 10)}
            />
          </Field>
          <Field label={t.deadline}>
            <input
              name="deadline"
              required
              type="date"
              defaultValue={project?.deadline.slice(0, 10)}
            />
          </Field>
          <Field label={t.progress} hint={t.progressHint}>
            <input
              name="progress"
              type="number"
              required
              min={0}
              max={100}
              defaultValue={project?.progress ?? 0}
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
                  name="serviceIds"
                  value={service.slug}
                  defaultChecked={project?.serviceIds.includes(service.slug)}
                />
                <span>{service.title}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <Field label={t.notes}>
          <textarea
            name="notes"
            rows={3}
            maxLength={10000}
            defaultValue={project?.notes}
          />
        </Field>
        <fieldset className="workspace-fieldset">
          <legend>{t.milestones}</legend>
          {milestones.map((milestone) => (
            <div className="workspace-milestone-editor" key={milestone.id}>
              <Field label={t.milestoneTitleEn}>
                <input
                  required
                  value={milestone.title.en}
                  onChange={(event) =>
                    changeMilestone(milestone.id, "en", event.target.value)
                  }
                  dir="ltr"
                  maxLength={200}
                />
              </Field>
              <Field label={t.milestoneTitleFa}>
                <input
                  required
                  value={milestone.title.fa}
                  onChange={(event) =>
                    changeMilestone(milestone.id, "fa", event.target.value)
                  }
                  dir="rtl"
                  maxLength={200}
                />
              </Field>
              <label className="workspace-checkbox">
                <input
                  type="checkbox"
                  checked={milestone.completed}
                  onChange={(event) =>
                    changeMilestone(
                      milestone.id,
                      "completed",
                      event.target.checked,
                    )
                  }
                />
                <span>{t.completed}</span>
              </label>
              <button
                type="button"
                className="workspace-icon-button"
                aria-label={t.remove}
                onClick={() =>
                  setMilestones((items) =>
                    items.filter((item) => item.id !== milestone.id),
                  )
                }
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))}
          <button
            className="workspace-button"
            type="button"
            onClick={() =>
              setMilestones((items) => [
                ...items,
                {
                  id: crypto.randomUUID(),
                  title: { en: "", fa: "" },
                  completed: false,
                },
              ])
            }
          >
            <Plus size={15} />
            {t.addMilestone}
          </button>
        </fieldset>
        <MutationFeedback feedback={mutation.feedback} />
        <SaveButton pending={mutation.pending} locale={locale}>
          {project ? t.save : t.createProject}
        </SaveButton>
      </FormControls>
    </form>
  );
}
