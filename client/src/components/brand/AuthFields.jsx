import { useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const passwordScore = (pw = "") => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(4, score);
};

const LABELS = ["Too short", "Weak", "Okay", "Good", "Strong"];

export function PasswordField({ id, label, labelAside, value, onChange, error, placeholder, autoComplete, showStrength = false, autoFocus }) {
  const [show, setShow] = useState(false);
  const score = passwordScore(value);
  return (
    <div className="br-field">
      <label htmlFor={id}>
        {label}
        {labelAside}
      </label>
      <div className="br-input-wrap">
        <input
          id={id}
          name={id}
          className={`br-input${error ? " err" : ""}`}
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-err` : undefined}
        />
        <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"}>
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {showStrength && value && (
        <div style={{ display: "grid", gap: 6 }}>
          <div className="br-strength" aria-hidden="true">
            {[1, 2, 3, 4].map((n) => (
              <i key={n} className={score >= n ? `on${score}` : ""} />
            ))}
          </div>
          <span style={{ fontSize: 12, color: "#8d8ea0" }}>{LABELS[score]}. Use 8+ characters with a mix of letters, numbers and symbols.</span>
        </div>
      )}
      {error && (
        <p id={`${id}-err`} className="br-err" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextField({ id, label, labelAside, error, ...props }) {
  return (
    <div className="br-field">
      <label htmlFor={id}>
        {label}
        {labelAside}
      </label>
      <input id={id} name={id} className={`br-input${error ? " err" : ""}`} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-err` : undefined} {...props} />
      {error && (
        <p id={`${id}-err`} className="br-err" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** Six single-character boxes. Supports typing, backspace, arrows and pasting a full code. */
export function CodeInput({ value, onChange, length = 6, error, autoFocus = true }) {
  const refs = useRef([]);
  const chars = Array.from({ length }, (_, i) => value[i] ?? "");

  const set = (index, ch) => {
    const next = chars.slice();
    next[index] = ch;
    onChange(next.join("").slice(0, length));
  };

  const onKeyDown = (i) => (e) => {
    if (e.key === "Backspace" && !chars[i] && i > 0) {
      refs.current[i - 1]?.focus();
      set(i - 1, "");
    } else if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === "ArrowRight" && i < length - 1) refs.current[i + 1]?.focus();
  };

  const onInput = (i) => (e) => {
    const ch = e.target.value.replace(/[^A-Za-z0-9]/g, "").slice(-1).toUpperCase();
    set(i, ch);
    if (ch && i < length - 1) refs.current[i + 1]?.focus();
  };

  const onPaste = (e) => {
    const text = e.clipboardData.getData("text").replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, length);
    if (!text) return;
    e.preventDefault();
    onChange(text);
    refs.current[Math.min(text.length, length - 1)]?.focus();
  };

  return (
    <div>
      <div className="br-code" role="group" aria-label="Verification code" onPaste={onPaste}>
        {chars.map((ch, i) => (
          <input
            key={i}
            ref={(el) => (refs.current[i] = el)}
            className={`br-input${error ? " err" : ""}`}
            inputMode="text"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            autoFocus={autoFocus && i === 0}
            maxLength={2}
            value={ch}
            onChange={onInput(i)}
            onKeyDown={onKeyDown(i)}
            onFocus={(e) => e.target.select()}
            aria-label={`Character ${i + 1}`}
          />
        ))}
      </div>
      {error && (
        <p className="br-err" role="alert" style={{ marginTop: 8 }}>
          {error}
        </p>
      )}
    </div>
  );
}

export function GoogleButton({ onClick, disabled, children = "Continue with Google" }) {
  return (
    <button type="button" className="br-btn soft block" onClick={onClick} disabled={disabled}>
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
      {children}
    </button>
  );
}
