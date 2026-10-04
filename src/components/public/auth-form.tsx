"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { dictionary, type Locale } from "@/lib/i18n";
export function AuthForm({ locale }: { locale: Locale }) {
  const router = useRouter();
  const d = dictionary(locale);
  const t = d.auth;
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") || "").trim();
    const password = String(f.get("password") || "");
    const name = String(f.get("name") || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t.emailInvalid);
      return;
    }
    if (register) {
      if (name.length < 2) {
        setError(t.nameInvalid);
        return;
      }
      if (
        password.length < 12 ||
        !/[A-Z]/.test(password) ||
        !/[a-z]/.test(password) ||
        !/[0-9]/.test(password)
      ) {
        setError(t.passwordInvalid);
        return;
      }
      if (password !== String(f.get("confirmPassword"))) {
        setError(t.passwordMismatch);
        return;
      }
    }
    setBusy(true);
    try {
      const result : any = register
        ? await authClient.signUp.email({ email, password, name }) && console.log({email , password , name})
        : await authClient.signIn.email({ email, password }) && console.log({email , password , name})
      if (result.error) {
        if (result.error.status === 429) {
          setError(t.rateLimit);
        } else if (result.error.status >= 500) {
          setError(t.serverError);
        } else {
          setError(register ? t.registerError : t.invalidCredentials);
        }
        return;
      }
      const user = result.data?.user;
      const area =
        user && "role" in user && user.role === "ADMIN" ? "admin" : "dashboard";
      router.replace(`/${locale}/${area}`);
      router.refresh();
    } catch {
      setError(d.common.networkError);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-form-wrap">
      <h2>{register ? t.registerTitle : t.loginTitle}</h2>
      <p>{register ? t.registerDescription : t.loginDescription}</p>
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
      <form onSubmit={submit} noValidate aria-busy={busy}>
        {register && (
          <div className="field">
            <label htmlFor="auth-name">{t.name}</label>
            <input
              id="auth-name"
              name="name"
              required
              autoComplete="name"
              maxLength={100}
            />
          </div>
        )}
        <div className="field">
          <label htmlFor="auth-email">{t.email}</label>
          <input
            id="auth-email"
            name="email"
            type="email"
            dir="ltr"
            autoComplete="email"
            required
            maxLength={254}
          />
        </div>
        <div className="field">
          <label htmlFor="auth-password">{t.password}</label>
          <input
            id="auth-password"
            name="password"
            type="password"
            dir="ltr"
            autoComplete={register ? "new-password" : "current-password"}
            required
            maxLength={128}
          />
          {register && <p className="form-note">{t.passwordHint}</p>}
        </div>
        {register && (
          <div className="field">
            <label htmlFor="auth-confirm">{t.confirmPassword}</label>
            <input
              id="auth-confirm"
              name="confirmPassword"
              type="password"
              dir="ltr"
              autoComplete="new-password"
              required
              maxLength={128}
            />
          </div>
        )}
        <button type="submit" className="btn" disabled={busy}>
          {busy
            ? register
              ? t.creating
              : t.loggingIn
            : register
              ? t.register
              : t.login}
        </button>
      </form>
      <p className="auth-switch">
        {register ? t.haveAccount : t.noAccount}{" "}
        <button
          type="button"
          className="auth-toggle"
          onClick={() => {
            setRegister(!register);
            setError("");
          }}
        >
          {register ? t.login : t.register}
        </button>
      </p>
    </div>
  );
}
