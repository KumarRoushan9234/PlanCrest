import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AuthShell from "../components/brand/AuthShell";
import { CodeInput, PasswordField } from "../components/brand/AuthFields";

export default function ResetPasswordPage() {
  const { resetPassword, forgotPassword } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "";
  const [form, setForm] = useState({ code: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(45);

  useEffect(() => {
    if (!email) navigate("/forgot-password", { replace: true });
  }, [email, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((errs) => ({ ...errs, [key]: undefined, form: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (form.code.length < 6) next.code = "Enter the 6-character code from your email";
    if (form.password.length < 8) next.password = "Use at least 8 characters";
    if (form.confirm !== form.password) next.confirm = "Passwords don't match";
    if (Object.keys(next).length) return setErrors(next);

    setBusy(true);
    try {
      await resetPassword(email, form.code, form.password);
      navigate("/login", { state: { message: "Password updated. Sign in with your new password." } });
    } catch (err) {
      setErrors({ form: err?.response?.data?.error || "That code is invalid or has expired." });
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (cooldown > 0) return;
    try {
      await forgotPassword(email);
      setCooldown(45);
    } catch {
      /* toast already shown */
    }
  };

  if (!email) return null;

  return (
    <AuthShell
      title="Choose a new password"
      subtitle={
        <>
          Enter the code we sent to <b style={{ color: "#fff" }}>{email}</b>, then pick a new password.
        </>
      }
      back={{ to: "/forgot-password", label: "Use a different email" }}
      footer={
        <>
          <button type="button" onClick={resend} disabled={cooldown > 0} style={{ background: "none", border: 0, padding: 0, color: cooldown > 0 ? "#6d6e80" : "var(--brand-lav)", fontWeight: 600, cursor: cooldown > 0 ? "default" : "pointer", font: "inherit" }}>
            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend the code"}
          </button>
          {" · "}
          <Link to="/login">Back to sign in</Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate style={{ display: "grid", gap: 16 }}>
        <div className="br-field">
          <label>Reset code</label>
          <CodeInput value={form.code} onChange={(code) => { setForm((f) => ({ ...f, code })); setErrors((x) => ({ ...x, code: undefined })); }} error={errors.code} />
        </div>
        <PasswordField id="password" label="New password" autoComplete="new-password" placeholder="At least 8 characters" value={form.password} onChange={set("password")} error={errors.password} showStrength />
        <PasswordField id="confirm" label="Confirm new password" autoComplete="new-password" placeholder="Repeat your password" value={form.confirm} onChange={set("confirm")} error={errors.confirm} />
        {errors.form && (
          <p className="br-err" role="alert">
            {errors.form}
          </p>
        )}
        <button type="submit" className="br-btn primary block" disabled={busy}>
          {busy ? "Updating…" : "Update password"}
        </button>
      </form>
    </AuthShell>
  );
}
