import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { takeNext } from "../utils/redirect";
import AuthShell from "../components/brand/AuthShell";
import { GoogleButton, PasswordField, TextField } from "../components/brand/AuthFields";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const { login, loginWithGoogle, isGoogleSignInEnabled } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((errs) => ({ ...errs, [key]: undefined, form: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!EMAIL_RE.test(form.email.trim())) next.email = "Enter a valid email address";
    if (!form.password) next.password = "Enter your password";
    if (Object.keys(next).length) return setErrors(next);

    setBusy(true);
    try {
      await login(form.email.trim(), form.password);
      navigate(takeNext());
    } catch (error) {
      const message = error?.response?.data?.error;
      if (message === "Email not verified") {
        navigate("/verify-email", { state: { email: form.email.trim() } });
      } else {
        setErrors({ form: message || "We couldn't sign you in. Check your details and try again." });
      }
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    try {
      await loginWithGoogle();
      navigate(takeNext());
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to pick up where you left off."
      back={{ to: "/", label: "Back to home" }}
      footer={
        <>
          New to PlanCrest? <Link to="/register">Create an account</Link>
        </>
      }
    >
      {location.state?.message && (
        <div className="br-note" role="status">
          <CheckCircle2 size={18} color="#00ddb3" style={{ flex: "none", marginTop: 1 }} />
          {location.state.message}
        </div>
      )}

      <form onSubmit={submit} noValidate style={{ display: "grid", gap: 16 }}>
        <TextField id="email" label="Email" type="email" autoComplete="email" autoFocus placeholder="you@company.com" value={form.email} onChange={set("email")} error={errors.email} />
        <PasswordField
          id="password"
          label="Password"
          labelAside={<Link to="/forgot-password">Forgot password?</Link>}
          autoComplete="current-password"
          placeholder="Your password"
          value={form.password}
          onChange={set("password")}
          error={errors.password}
        />
        {errors.form && (
          <p className="br-err" role="alert">
            {errors.form}
          </p>
        )}
        <button type="submit" className="br-btn primary block" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {isGoogleSignInEnabled && (
        <>
          <div className="br-or">or</div>
          <GoogleButton onClick={google} disabled={busy} />
        </>
      )}
    </AuthShell>
  );
}
