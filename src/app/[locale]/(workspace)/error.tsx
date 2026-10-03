"use client";
import { useParams } from "next/navigation";
import { dashboardMessages } from "@/content/dashboard-messages";
export default function WorkspaceError({ reset }: { reset: () => void }) {
  const params = useParams();
  const t = dashboardMessages(params.locale === "fa" ? "fa" : "en");
  return (
    <div
      className="workspace-error"
      dir={params.locale === "fa" ? "rtl" : "ltr"}
    >
      <h1>{t.errorTitle}</h1>
      <p>{t.error}</p>
      <button className="workspace-button primary" onClick={reset}>
        {t.retry}
      </button>
    </div>
  );
}
