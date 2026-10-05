import { getServices } from "@/content/services";
import { listServiceSettings } from "./repository";
import type { Locale } from "./i18n";
export async function getVisibleServices(locale: Locale) {
  const settings = (await listServiceSettings());
  return settings
    .filter((s) => s.visible)
    .flatMap((setting) =>
      getServices(locale).filter((s) => s.slug === setting.slug),
    );
}
