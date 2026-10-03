import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/auth-context";
import { useToast } from "../context/toast-context";

export function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { login, isAuthenticated } = useAuth();
  const { show: toast } = useToast();
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const next = params.get("next") ?? "/";

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
    try {
      const user = await login(form.email, form.password);
      toast("success", "Welcome back!", `Hi ${user.name}!`);
      navigate(next, { replace: true });
    } catch {
      setErrors({ password: "Invalid email or password" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="auth-card__mark" aria-hidden="true">EX</div>
        <h1 className="auth-card__title">Welcome back</h1>
        <p className="auth-card__sub">Sign in to your Eventix account</p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
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

          <div className="field">
            <label className="field-label" htmlFor="login-password">Password</label>
            <div style={{ position: "relative" }}>
              <input
                id="login-password"
                type={showPw ? "text" : "password"}
                className={`input${errors.password ? " input--error" : ""}`}
                placeholder="Your password"
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                disabled={loading}
                style={{ paddingRight: "2.75rem" }}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
                style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--ev-text-subtle)", cursor: "pointer" }}
              >
                {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.password && <span className="field-error" role="alert">{errors.password}</span>}
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            className={`btn btn--primary${loading ? " btn--loading" : ""}`}
            style={{ width: "100%", marginTop: "0.25rem" }}
            disabled={loading}
          >
            {loading ? "" : "Sign in"}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account?{" "}
          <Link to="/register">Create one free</Link>
        </p>
      </motion.div>
    </div>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();
  const { show: toast } = useToast();
  const [showPw, setShowPw] = useState(false);
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
    try {
      const user = await register(form.name, form.email, form.password);
      toast("success", "Account created!", `Welcome to Eventix, ${user.name}!`);
      navigate("/", { replace: true });
    } catch {
      setErrors({ email: "An account with this email already exists" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="auth-card__mark" aria-hidden="true">EX</div>
        <h1 className="auth-card__title">Create account</h1>
        <p className="auth-card__sub">Join Eventix — free, instant, no hassle</p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label className="field-label" htmlFor="reg-name">Full name</label>
            <input
              id="reg-name"
              type="text"
              className={`input${errors.name ? " input--error" : ""}`}
              placeholder="Jane Doe"
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

          <div className="field">
            <label className="field-label" htmlFor="reg-password">Password</label>
            <div style={{ position: "relative" }}>
              <input
                id="reg-password"
                type={showPw ? "text" : "password"}
                className={`input${errors.password ? " input--error" : ""}`}
                placeholder="At least 6 characters"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                disabled={loading}
                style={{ paddingRight: "2.75rem" }}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
                style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--ev-text-subtle)", cursor: "pointer" }}
              >
                {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.password && <span className="field-error" role="alert">{errors.password}</span>}
          </div>

          <button
            id="register-submit-btn"
            type="submit"
            className={`btn btn--primary${loading ? " btn--loading" : ""}`}
            style={{ width: "100%", marginTop: "0.25rem" }}
            disabled={loading}
          >
            {loading ? "" : "Create account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{" "}
          <Link to="/login">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
