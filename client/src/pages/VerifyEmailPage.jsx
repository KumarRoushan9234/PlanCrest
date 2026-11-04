import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import AuthShell from "../components/brand/AuthShell";
import { CodeInput } from "../components/brand/AuthFields";

const RESEND_SECONDS = 45;

export default function VerifyEmailPage() {
  const { verifyEmail, resendVerification } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "";
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (!email) navigate("/register", { replace: true });
  }, [email, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const verify = async (value = code) => {
    if (value.length < 6) return setError("Enter the 6-character code from your email");
    setBusy(true);
    try {
      await verifyEmail(email, value);
      navigate("/login", { state: { message: "Email verified. You can now sign in." } });
    } catch (e) {
      setError(e?.response?.data?.error || "That code didn't work. Check it and try again.");
    } finally {
      setBusy(false);
    }
  };

  const onChange = (value) => {
    setCode(value);
    setError("");
    if (value.length === 6) verify(value);
  };

  const resend = async () => {
    if (cooldown > 0) return;
    try {
      await resendVerification(email);
      setCooldown(RESEND_SECONDS);
      setCode("");
    } catch {
      /* the context already shows a toast */
    }
  };

  if (!email) return null;

  return (
    <AuthShell
      title="Check your email"
      back={{ to: "/register", label: "Use a different email" }}
    >
      <p className="br-sub">{email}</p>
      <span className="br-success">
        <MailCheck size={26} />
      </span>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          verify();
        }}
        style={{ display: "grid", gap: 16 }}
      >
        <CodeInput value={code} onChange={onChange} error={error} />
        <button type="submit" className="br-btn primary block" disabled={busy || code.length < 6}>
          {busy ? "Verifying…" : "Verify email"}
        </button>
      </form>
      <p className="br-foot">
        Didn't get it? Check your spam folder or{" "}
        <button type="button" onClick={resend} disabled={cooldown > 0} style={{ background: "none", border: 0, padding: 0, color: cooldown > 0 ? "#6d6e80" : "var(--brand-lav)", fontWeight: 600, cursor: cooldown > 0 ? "default" : "pointer", font: "inherit" }}>
          {cooldown > 0 ? `resend in ${cooldown}s` : "resend the code"}
        </button>
      </p>
    </AuthShell>
  );
}
