"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  ChevronDown,
  CircleHelp,
  Files,
  FolderKanban,
  Globe2,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  PanelsTopLeft,
  Settings2,
  Users,
  X,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Brand } from "@/components/public/brand";
import type { Locale } from "@/lib/i18n";
import { dashboardMessages } from "@/content/dashboard-messages";

type Props = {
  locale: Locale;
  admin?: boolean;
  user: { name: string; email: string };
  children: ReactNode;
};

export function DashboardShell({
  locale,
  admin = false,
  user,
  children,
}: Props) {
  const t = dashboardMessages(locale);
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);
  const base = `/${locale}/${admin ? "admin" : "dashboard"}`;
  const navigation = admin
    ? [
        { key: "", label: t.overview, icon: LayoutDashboard },
        { key: "users", label: t.users, icon: Users },
        { key: "leads", label: t.leads, icon: MessageSquare },
        { key: "projects", label: t.projects, icon: FolderKanban },
        { key: "services", label: t.services, icon: BriefcaseBusiness },
        { key: "blog", label: t.blog, icon: BookOpen },
        { key: "portfolio", label: t.portfolio, icon: PanelsTopLeft },
      ]
    : [
        { key: "", label: t.overview, icon: LayoutDashboard },
        { key: "services", label: t.services, icon: BriefcaseBusiness },
        { key: "projects", label: t.projects, icon: FolderKanban },
        { key: "reports", label: t.reports, icon: PanelsTopLeft },
        { key: "deliverables", label: t.deliverables, icon: Files },
        { key: "profile", label: t.profile, icon: Settings2 },
      ];
  async function signOut() {
    setSigningOut(true);
    setSignOutError("");
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error();
      router.push(`/${locale}/login`);
      router.refresh();
    } catch {
      setSignOutError(t.error);
      setSigningOut(false);
    }
  }
  return (
    <div className="workspace" dir={locale === "fa" ? "rtl" : "ltr"}>
      <a className="workspace-skip" href="#workspace-main">
        {t.overview}
      </a>
      {open && (
        <button
          className="workspace-backdrop"
          onClick={() => setOpen(false)}
          aria-label={t.closeMenu}
        />
      )}
      <aside
        id="workspace-navigation"
        className={`workspace-sidebar ${open ? "is-open" : ""}`}
        aria-label={t.workspace}
      >
        <div className="workspace-brand-row">
          <Brand href={`/${locale}`} />
          <button
            className="workspace-icon-button mobile-only"
            onClick={() => setOpen(false)}
            aria-label={t.closeMenu}
          >
            <X size={20} />
          </button>
        </div>
        <div className="workspace-space">
          <span className="workspace-space-icon">
            <BriefcaseBusiness size={17} />
          </span>
          <div>
            <strong>{admin ? t.admin : t.customer}</strong>
            <span>Salsal</span>
          </div>
          <ChevronDown size={15} />
        </div>
        <div className="workspace-nav-label">{t.workspace}</div>
        <nav className="workspace-nav">
          {navigation.map((item) => {
            const href = `${base}${item.key ? `/${item.key}` : ""}`;
            const active = item.key
              ? pathname.startsWith(`${base}/${item.key}`)
              : pathname === base;
            return (
              <Link
                key={item.key}
                href={href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={active ? "is-active" : ""}
              >
                <item.icon size={19} strokeWidth={1.7} />
                <span>{item.label}</span>
                {active && <span className="nav-dot" />}
              </Link>
            );
          })}
        </nav>
        <div className="workspace-sidebar-bottom">
          <div className="workspace-help">
            <CircleHelp size={21} />
            <strong>{t.needHelp}</strong>
            <p>{t.supportCopy}</p>
            <Link href={`/${locale}/contact`}>
              {t.contactTeam}
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <Link className="workspace-site-link" href={`/${locale}`}>
            <Globe2 size={17} />
            {t.website}
            <ArrowUpRight size={15} />
          </Link>
        </div>
      </aside>
      <div className="workspace-body">
        <header className="workspace-topbar">
          <div className="workspace-topbar-title">
            <button
              className="workspace-icon-button mobile-only"
              onClick={() => setOpen(true)}
              aria-expanded={open}
              aria-controls="workspace-navigation"
              aria-label={t.openMenu}
            >
              <Menu size={22} />
            </button>
            <span>{admin ? t.admin : t.customer}</span>
            <span className="workspace-topbar-divider">/</span>
            <strong>
              {navigation.find(
                (item) =>
                  item.key && pathname.startsWith(`${base}/${item.key}`),
              )?.label ?? t.overview}
            </strong>
          </div>
          <div className="workspace-account">
            <Link
              className="workspace-language"
              href={pathname.replace(
                /^\/(en|fa)(?=\/|$)/,
                locale === "fa" ? "/en" : "/fa",
              )}
              hrefLang={locale === "fa" ? "en" : "fa"}
            >
              {t.switchLanguage}
            </Link>
            <Link
              href={`${base}#activity`}
              className="workspace-icon-button"
              aria-label={t.notification}
            >
              <Bell size={19} />
            </Link>
            <details className="workspace-account-menu">
              <summary aria-label={t.account}>
                <span className="workspace-avatar">
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="workspace-account-name">{user.name}</span>
                <ChevronDown size={14} />
              </summary>
              <div className="workspace-account-dropdown">
                <strong>{user.name}</strong>
                <small dir="ltr">{user.email}</small>
                <Link href={`/${locale}/dashboard/profile`}>{t.profile}</Link>
                <button onClick={signOut} disabled={signingOut}>
                  <LogOut size={15} />
                  {signingOut ? "…" : t.signOut}
                </button>
                {signOutError && <p role="alert">{signOutError}</p>}
              </div>
            </details>
          </div>
        </header>
        <main id="workspace-main" className="workspace-main">
          {children}
        </main>
        <footer className="workspace-footer">
          <span>© {new Date().getFullYear()} Salsal</span>
          <span>{t.workspace}</span>
        </footer>
      </div>
    </div>
  );
}
