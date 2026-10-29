import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { takeNext } from "../utils/redirect";
import AuthShell from "../components/brand/AuthShell";
import { GoogleButton, PasswordField, TextField } from "../components/brand/AuthFields";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const { register, loginWithGoogle, isGoogleSignInEnabled } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((errs) => ({ ...errs, [key]: undefined, form: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = "Tell us your name";
    if (!EMAIL_RE.test(form.email.trim())) next.email = "Enter a valid email address";
    if (form.password.length < 8) next.password = "Use at least 8 characters";
    if (form.confirm !== form.password) next.confirm = "Passwords don't match";
    if (Object.keys(next).length) return setErrors(next);

    setBusy(true);
    try {
      await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      navigate("/verify-email", { state: { email: form.email.trim() } });
    } catch (error) {
      setErrors({ form: error?.response?.data?.error || "We couldn't create your account. Please try again." });
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
      title="Create your account"
      subtitle="Free and open source. No credit card needed."
      back={{ to: "/", label: "Back to home" }}
      footer={
        <>
          Already have an account? <Link to="/login">Sign in</Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate style={{ display: "grid", gap: 16 }}>
        <TextField id="name" label="Full name" autoComplete="name" autoFocus placeholder="Alex Morgan" value={form.name} onChange={set("name")} error={errors.name} />
        <TextField id="email" label="Work email" type="email" autoComplete="email" placeholder="you@company.com" value={form.email} onChange={set("email")} error={errors.email} />
        <PasswordField id="password" label="Password" autoComplete="new-password" placeholder="At least 8 characters" value={form.password} onChange={set("password")} error={errors.password} showStrength />
        <PasswordField id="confirm" label="Confirm password" autoComplete="new-password" placeholder="Repeat your password" value={form.confirm} onChange={set("confirm")} error={errors.confirm} />
        {errors.form && (
          <p className="br-err" role="alert">
            {errors.form}
          </p>
        )}
        <button type="submit" className="br-btn primary block" disabled={busy}>
          {busy ? "Creating account…" : "Create account"}
        </button>
        <p style={{ margin: 0, fontSize: 12.5, color: "#7c7d8e", textAlign: "center" }}>
          By continuing you agree to use PlanCrest responsibly. It's open source under the MIT license.
        </p>
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
