import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AuthShell from "../components/brand/AuthShell";
import { TextField } from "../components/brand/AuthFields";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) return setError("Enter a valid email address");
    setBusy(true);
    try {
      await forgotPassword(email.trim());
      navigate("/reset-password", { state: { email: email.trim() } });
    } catch (err) {
      setError(err?.response?.data?.error || "We couldn't send the code. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we'll send you a code to set a new password."
      back={{ to: "/login", label: "Back to sign in" }}
      footer={
        <>
          Remembered it? <Link to="/login">Sign in</Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate style={{ display: "grid", gap: 16 }}>
        <TextField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          autoFocus
          placeholder="you@company.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
          error={error}
        />
        <button type="submit" className="br-btn primary block" disabled={busy}>
          {busy ? "Sending…" : "Send reset code"}
        </button>
      </form>
    </AuthShell>
  );
}
