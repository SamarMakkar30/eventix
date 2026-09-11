import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Brand } from "../components/layout";
import { Button, Input } from "../components/ui";
import { useAuth } from "../context/auth-context";
import { useToast } from "../context/toast-context";

const loginSchema = z.object({ email: z.string().email("Enter a valid email address"), password: z.string().min(1, "Enter your password") });
const registerSchema = z.object({ name: z.string().min(2, "Enter your name"), email: z.string().email("Enter a valid email address"), password: z.string().min(8, "Use at least 8 characters") });
type LoginFields = z.infer<typeof loginSchema>; type RegisterFields = z.infer<typeof registerSchema>;

function AuthShell({ children, title, lead, quote }: { children: React.ReactNode; title: string; lead: string; quote: string }) { return <div className="auth-page"><aside className="auth-aside"><Brand /><div><p className="eyebrow">EVENTIX MEMBERSHIP</p><h1>Plans worth <em>looking forward to.</em></h1><blockquote>“{quote}”</blockquote><span>— The Eventix experience</span></div><div className="auth-atmosphere" /></aside><main className="auth-main"><div className="auth-mobile-brand"><Brand /></div><div className="auth-form-wrap"><p className="eyebrow">WELCOME TO EVENTIX</p><h2>{title}</h2><p>{lead}</p>{children}</div></main></div>; }

export function LoginPage() {
  const { login, isAuthenticated } = useAuth(); const toast = useToast(); const navigate = useNavigate(); const location = useLocation(); const [showPassword, setShowPassword] = useState(false);
  const form = useForm<LoginFields>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
  const next = new URLSearchParams(location.search).get("next") || "/";
  if (isAuthenticated) return <Navigate to={next} replace />;
  const submit = async (values: LoginFields) => { try { await login(values.email, values.password); toast.show("success", "Welcome back", "Your Eventix account is ready."); navigate(next, { replace: true }); } catch (error) { form.setError("root", { message: error instanceof Error ? error.message : "Couldn’t sign you in" }); } };
  return <AuthShell title="Welcome back." lead="Your next great night out is waiting." quote="The best plans usually start with a simple yes."><form onSubmit={form.handleSubmit(submit)} noValidate><Input label="Email" type="email" autoComplete="email" placeholder="you@example.com" error={form.formState.errors.email?.message} {...form.register("email")} /><div className="password-field"><Input label="Password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Your password" error={form.formState.errors.password?.message} {...form.register("password")} /><button type="button" className="password-toggle" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>{form.formState.errors.root && <p className="form-error" role="alert">{form.formState.errors.root.message}</p>}<Button loading={form.formState.isSubmitting} type="submit">Log in <LockKeyhole size={16} /></Button></form><p className="auth-switch">New to Eventix? <Link to="/register">Create an account</Link></p></AuthShell>;
}

export function RegisterPage() {
  const { register: registerUser, isAuthenticated } = useAuth(); const toast = useToast(); const navigate = useNavigate(); const [showPassword, setShowPassword] = useState(false);
  const form = useForm<RegisterFields>({ resolver: zodResolver(registerSchema), defaultValues: { name: "", email: "", password: "" } });
  if (isAuthenticated) return <Navigate to="/" replace />;
  const submit = async (values: RegisterFields) => { try { await registerUser(values.name, values.email, values.password); toast.show("success", "You’re in", "Your Eventix account is ready to explore."); navigate("/", { replace: true }); } catch (error) { form.setError("root", { message: error instanceof Error ? error.message : "Couldn’t create your account" }); } };
  return <AuthShell title="The good stuff starts here." lead="Create your account and make room for memorable plans." quote="It’s not just a ticket. It’s the beginning of a story."><form onSubmit={form.handleSubmit(submit)} noValidate><Input label="Your name" autoComplete="name" placeholder="How should we call you?" error={form.formState.errors.name?.message} {...form.register("name")} /><Input label="Email" type="email" autoComplete="email" placeholder="you@example.com" error={form.formState.errors.email?.message} {...form.register("email")} /><div className="password-field"><Input label="Password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="At least 8 characters" error={form.formState.errors.password?.message} {...form.register("password")} /><button type="button" className="password-toggle" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>{form.formState.errors.root && <p className="form-error" role="alert">{form.formState.errors.root.message}</p>}<Button loading={form.formState.isSubmitting} type="submit">Create my account <UserRound size={16} /></Button></form><p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p></AuthShell>;
}
