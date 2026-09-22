import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { motion } from "motion/react";
import { Brand } from "../components/layout";
import { Button, Input } from "../components/ui";
import { useAuth } from "../context/auth-context";
import { useToast } from "../context/toast-context";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});
const registerSchema = z.object({
  name: z.string().min(2, "Enter your name"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Use at least 8 characters"),
});
type LoginFields = z.infer<typeof loginSchema>;
type RegisterFields = z.infer<typeof registerSchema>;

const formFieldVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: 0.35 + i * 0.1, ease: "easeOut" as const },
  }),
};

function AuthShell({
  children,
  title,
  lead,
  quote,
}: {
  children: React.ReactNode;
  title: string;
  lead: string;
  quote: string;
}) {
  return (
    <div className="auth-page">
      <motion.aside
        className="auth-aside"
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <Brand />
        <div>
          <p className="eyebrow">EVENTIX MEMBERSHIP</p>
          <h1>
            Plans worth <em>looking forward to.</em>
          </h1>
          <blockquote>"{quote}"</blockquote>
          <span>— The Eventix experience</span>
        </div>
        <div className="auth-atmosphere" />
      </motion.aside>
      <main className="auth-main">
        <div className="auth-mobile-brand">
          <Brand />
        </div>
        <motion.div
          className="auth-form-wrap"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <motion.p
            className="eyebrow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            WELCOME TO EVENTIX
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            {lead}
          </motion.p>
          {children}
        </motion.div>
      </main>
    </div>
  );
}

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const next = new URLSearchParams(location.search).get("next") || "/";
  if (isAuthenticated) return <Navigate to={next} replace />;
  const submit = async (values: LoginFields) => {
    try {
      await login(values.email, values.password);
      toast.show("success", "Welcome back", "Your Eventix account is ready.");
      navigate(next, { replace: true });
    } catch (error) {
      form.setError("root", {
        message: error instanceof Error ? error.message : "Couldn't sign you in",
      });
    }
  };
  return (
    <AuthShell
      title="Welcome back."
      lead="Your next great night out is waiting."
      quote="The best plans usually start with a simple yes."
    >
      <form onSubmit={form.handleSubmit(submit)} noValidate>
        <motion.div variants={formFieldVariants} initial="hidden" animate="visible" custom={0}>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            error={form.formState.errors.email?.message}
            {...form.register("email")}
          />
        </motion.div>
        <motion.div variants={formFieldVariants} initial="hidden" animate="visible" custom={1}>
          <div className="password-field">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Your password"
              error={form.formState.errors.password?.message}
              {...form.register("password")}
            />
            <button
              type="button"
              className="password-toggle"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </motion.div>
        {form.formState.errors.root && (
          <motion.p
            className="form-error"
            role="alert"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {form.formState.errors.root.message}
          </motion.p>
        )}
        <motion.div variants={formFieldVariants} initial="hidden" animate="visible" custom={2}>
          <Button loading={form.formState.isSubmitting} type="submit">
            Log in <LockKeyhole size={16} />
          </Button>
        </motion.div>
      </form>
      <motion.p
        className="auth-switch"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        New to Eventix? <Link to="/register">Create an account</Link>
      </motion.p>
    </AuthShell>
  );
}

export function RegisterPage() {
  const { register: registerUser, isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<RegisterFields>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });
  if (isAuthenticated) return <Navigate to="/" replace />;
  const submit = async (values: RegisterFields) => {
    try {
      await registerUser(values.name, values.email, values.password);
      toast.show("success", "You're in", "Your Eventix account is ready to explore.");
      navigate("/", { replace: true });
    } catch (error) {
      form.setError("root", {
        message: error instanceof Error ? error.message : "Couldn't create your account",
      });
    }
  };
  return (
    <AuthShell
      title="The good stuff starts here."
      lead="Create your account and make room for memorable plans."
      quote="It's not just a ticket. It's the beginning of a story."
    >
      <form onSubmit={form.handleSubmit(submit)} noValidate>
        <motion.div variants={formFieldVariants} initial="hidden" animate="visible" custom={0}>
          <Input
            label="Your name"
            autoComplete="name"
            placeholder="How should we call you?"
            error={form.formState.errors.name?.message}
            {...form.register("name")}
          />
        </motion.div>
        <motion.div variants={formFieldVariants} initial="hidden" animate="visible" custom={1}>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            error={form.formState.errors.email?.message}
            {...form.register("email")}
          />
        </motion.div>
        <motion.div variants={formFieldVariants} initial="hidden" animate="visible" custom={2}>
          <div className="password-field">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              error={form.formState.errors.password?.message}
              {...form.register("password")}
            />
            <button
              type="button"
              className="password-toggle"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </motion.div>
        {form.formState.errors.root && (
          <motion.p
            className="form-error"
            role="alert"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {form.formState.errors.root.message}
          </motion.p>
        )}
        <motion.div variants={formFieldVariants} initial="hidden" animate="visible" custom={3}>
          <Button loading={form.formState.isSubmitting} type="submit">
            Create my account <UserRound size={16} />
          </Button>
        </motion.div>
      </form>
      <motion.p
        className="auth-switch"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        Already have an account? <Link to="/login">Log in</Link>
      </motion.p>
    </AuthShell>
  );
}
