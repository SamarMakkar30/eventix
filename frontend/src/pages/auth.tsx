import { lazy, Suspense, useEffect, useState } from "react";
import { useDocumentMeta } from "../lib/use-document-meta";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuth } from "../context/auth-context";
import { useToast } from "../context/toast-context";
import type { ApiError } from "../api/client";

const AuroraCanvas = lazy(() => import("../components/aurora-canvas"));

/* Audit fix: a `next` of "//evil.com" or "https://…" must never leave the SPA. */
function safeNext(raw: string | null): string {
  if (!raw) return "/";
  if (!raw.startsWith("/")) return "/";
  if (raw.startsWith("//")) return "/";
  return raw;
}

/* Shared aside panel for the split-screen auth layout */
function AuthAside() {
  return (
    <aside className="auth-v2__aside grain" aria-hidden="true">
      <div className="hero-v2__canvas" style={{ position: "absolute", inset: 0, opacity: 0.85 }}>
        <Suspense fallback={null}>
          <AuroraCanvas />
        </Suspense>
      </div>
      <div className="hero-v2__veil" style={{ background: "linear-gradient(to bottom, rgba(14,10,11,.25), rgba(14,10,11,.78))" }} />
      <div className="auth-v2__aside-content">
        <Link to="/" className="brand-v2" style={{ color: "#F5EDDC" }} tabIndex={-1}>
          <span className="brand-v2__mark" style={{ background: "linear-gradient(135deg,#B23C4E,#6E2430)" }}>EX</span>
          <span className="brand-v2__name">Eventix</span>
        </Link>
        <motion.blockquote
          className="auth-v2__quote"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          “The lights go down, the room fills up — <em>and you're already in your seat.</em>”
        </motion.blockquote>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          style={{ color: "rgba(245,237,220,.66)", fontSize: "0.875rem", letterSpacing: "0.06em" }}
        >
          Movies · Concerts · One-night-only lineups
        </motion.p>
      </div>
    </aside>
  );
}

/* Shared password field */
function PasswordField({
  id, label, value, onChange, error, autoComplete, disabled, placeholder,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void;
  error?: string; autoComplete: string; disabled?: boolean; placeholder: string;
}) {
  const [showPw, setShowPw] = useState(false);
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          id={id}
          type={showPw ? "text" : "password"}
          className={`input${error ? " input--error" : ""}`}
          placeholder={placeholder}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          style={{ paddingRight: "2.75rem" }}
        />
        <button
          type="button"
          onClick={() => setShowPw((v) => !v)}
          aria-label={showPw ? "Hide password" : "Show password"}
          style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--ev-text-subtle)", cursor: "pointer" }}
        >
          {showPw ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
        </button>
      </div>
      {error && <span className="field-error" role="alert">{error}</span>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   LOGIN
   ══════════════════════════════════════════════════════════════════════════ */
export function LoginPage() {
  useDocumentMeta("Sign in — Eventix", "Sign in to your Eventix account to book movies and live events.");
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { login, isAuthenticated } = useAuth();
  const { show: toast } = useToast();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const next = safeNext(params.get("next"));

  useEffect(() => {
    if (isAuthenticated) navigate(next, { replace: true });
  }, [isAuthenticated, navigate, next]);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      const user = await login(form.email, form.password);
      toast("success", "Welcome back!", `Good to see you, ${user.name.split(" ")[0]}.`);
      navigate(next, { replace: true });
    } catch (err) {
      /* Audit fix: surface the API's real reason — network down, rate limit,
         or bad credentials each get their honest message. */
      const apiError = err as ApiError;
      const message = apiError?.message ?? "Something went wrong. Please try again.";
      if (apiError?.status === 401) {
        setErrors({ password: message || "Invalid email or password" });
      } else {
        // Network outage, 429, 5xx — none of these are "wrong password"
        setErrors({ form: message });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-v2">
      <AuthAside />
      <div className="auth-v2__main">
        <motion.div
          className="auth-v2__card"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="auth-card__mark" aria-hidden="true" style={{ background: "linear-gradient(135deg, var(--ev-accent), #4A151D)", boxShadow: "0 8px 24px var(--ev-glow-accent)" }}>EX</div>
          <h1 className="font-display" style={{ fontSize: "2.25rem", lineHeight: 1.05, marginBottom: "0.375rem" }}>
            Welcome <em style={{ color: "var(--ev-gold)" }}>back</em>
          </h1>
          <p className="auth-card__sub" style={{ marginBottom: "1.75rem" }}>Your seats have been waiting.</p>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {errors.form && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                role="alert"
                style={{
                  padding: "0.75rem 1rem",
                  background: "color-mix(in srgb, var(--ev-danger) 8%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--ev-danger) 30%, transparent)",
                  borderRadius: "var(--ev-radius-control)",
                  fontSize: "0.875rem",
                  color: "var(--ev-danger)",
                }}
              >
                {errors.form}
              </motion.div>
            )}

            <div className="field">
              <label className="field-label" htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                type="email"
                className={`input${errors.email ? " input--error" : ""}`}
                placeholder="you@example.com"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                disabled={loading}
              />
              {errors.email && <span className="field-error" role="alert">{errors.email}</span>}
            </div>

            <PasswordField
              id="login-password"
              label="Password"
              value={form.password}
              onChange={(v) => setForm((f) => ({ ...f, password: v }))}
              error={errors.password}
              autoComplete="current-password"
              disabled={loading}
              placeholder="Your password"
            />

            <button
              id="login-submit-btn"
              type="submit"
              className={`btn btn--primary btn--lg btn-shine${loading ? " btn--loading" : ""}`}
              style={{ width: "100%", marginTop: "0.25rem" }}
              disabled={loading}
            >
              {loading ? "" : <>Sign in <ArrowRight size={17} aria-hidden="true" /></>}
            </button>
          </form>

          <p className="auth-footer">
            New here?{" "}
            <Link to="/register">Create an account — it's free</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   REGISTER
   ══════════════════════════════════════════════════════════════════════════ */
export function RegisterPage() {
  useDocumentMeta("Create account — Eventix", "Create a free Eventix account — thirty seconds to your first ticket.");
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();
  const { show: toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, navigate]);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (form.password.length < 6) e.password = "Password must be at least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      const user = await register(form.name, form.email, form.password);
      toast("success", "Account created!", `Welcome to Eventix, ${user.name.split(" ")[0]}.`);
      navigate("/", { replace: true });
    } catch (err) {
      const apiError = err as ApiError;
      const message = apiError?.message ?? "Something went wrong. Please try again.";
      setErrors({ form: message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-v2">
      <AuthAside />
      <div className="auth-v2__main">
        <motion.div
          className="auth-v2__card"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="auth-card__mark" aria-hidden="true" style={{ background: "linear-gradient(135deg, var(--ev-accent), #4A151D)", boxShadow: "0 8px 24px var(--ev-glow-accent)" }}>EX</div>
          <h1 className="font-display" style={{ fontSize: "2.25rem", lineHeight: 1.05, marginBottom: "0.375rem" }}>
            Take your <em style={{ color: "var(--ev-gold)" }}>seat</em>
          </h1>
          <p className="auth-card__sub" style={{ marginBottom: "1.75rem" }}>Thirty seconds to your first ticket.</p>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {errors.form && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                role="alert"
                style={{
                  padding: "0.75rem 1rem",
                  background: "color-mix(in srgb, var(--ev-danger) 8%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--ev-danger) 30%, transparent)",
                  borderRadius: "var(--ev-radius-control)",
                  fontSize: "0.875rem",
                  color: "var(--ev-danger)",
                }}
              >
                {errors.form}
              </motion.div>
            )}

            <div className="field">
              <label className="field-label" htmlFor="reg-name">Full name</label>
              <input
                id="reg-name"
                type="text"
                className={`input${errors.name ? " input--error" : ""}`}
                placeholder="Your name"
                autoComplete="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                disabled={loading}
              />
              {errors.name && <span className="field-error" role="alert">{errors.name}</span>}
            </div>

            <div className="field">
              <label className="field-label" htmlFor="reg-email">Email address</label>
              <input
                id="reg-email"
                type="email"
                className={`input${errors.email ? " input--error" : ""}`}
                placeholder="you@example.com"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                disabled={loading}
              />
              {errors.email && <span className="field-error" role="alert">{errors.email}</span>}
            </div>

            <PasswordField
              id="reg-password"
              label="Password"
              value={form.password}
              onChange={(v) => setForm((f) => ({ ...f, password: v }))}
              error={errors.password}
              autoComplete="new-password"
              disabled={loading}
              placeholder="At least 6 characters"
            />

            <button
              id="register-submit-btn"
              type="submit"
              className={`btn btn--primary btn--lg btn-shine${loading ? " btn--loading" : ""}`}
              style={{ width: "100%", marginTop: "0.25rem" }}
              disabled={loading}
            >
              {loading ? "" : <>Create account <ArrowRight size={17} aria-hidden="true" /></>}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account?{" "}
            <Link to="/login">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
