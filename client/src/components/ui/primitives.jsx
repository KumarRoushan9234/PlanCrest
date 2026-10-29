// Console UI primitives. Thin React wrappers over the pc-* classes in styles/components.css.
import { Link } from "react-router-dom";
import { ChevronRight, Check, Copy, Loader2, Search, X } from "lucide-react";
import { useState } from "react";
import { avatarUrl, cn, initials } from "./utils";

export const Spinner = ({ className = "" }) => <span className={cn("pc-spin", className)} aria-label="Loading" />;

export function PageHead({ title, sub, crumbs, children }) {
  return (
    <div className="pc-head">
      <div>
        {crumbs?.length > 0 && (
          <nav className="pc-crumbs" aria-label="Breadcrumb">
            {crumbs.map((c, i) => (
              <span key={i} className="inline-flex items-center gap-1.5">
                {i > 0 && <ChevronRight size={12} />}
                {c.to ? <Link to={c.to}>{c.label}</Link> : <span>{c.label}</span>}
              </span>
            ))}
          </nav>
        )}
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {children && <div className="pc-actions">{children}</div>}
    </div>
  );
}

export function Card({ className = "", pad = true, flush = false, glow = false, children, ...rest }) {
  return (
    <section className={cn("pc-card", pad && "pad", flush && "flush", glow && "glow", className)} {...rest}>
      {children}
    </section>
  );
}

/** Card header: small tinted icon badge, title, and right-aligned tools. */
export function CardHead({ icon: Icon, title, tone, pad = false, children }) {
  return (
    <header className={cn("pc-card-head", pad && "pad")}>
      <h2>
        {Icon && (
          <span className={cn("pc-ico", tone)}>
            <Icon size={13} />
          </span>
        )}
        {title}
      </h2>
      {children && <div className="pc-card-tools">{children}</div>}
    </header>
  );
}

export function KpiStrip({ items }) {
  return (
    <div className="pc-kpis">
      {items.map((k) => (
        <div key={k.label} className={cn("pc-kpi", k.hl && "hl", k.bad && "bad")}>
          <span>{k.label}</span>
          <b>{k.value}</b>
          {k.note && <em>{k.note}</em>}
        </div>
      ))}
    </div>
  );
}

export function Seg({ value, onChange, options, className = "" }) {
  return (
    <div className={cn("pc-seg", className)} role="tablist">
      {options.map((o) => {
        const opt = typeof o === "string" ? { value: o, label: o } : o;
        return (
          <button key={opt.value} role="tab" aria-selected={value === opt.value} className={value === opt.value ? "on" : ""} onClick={() => onChange(opt.value)}>
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function Tabs({ value, onChange, tabs }) {
  return (
    <div className="pc-tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.value} role="tab" aria-selected={value === t.value} className={value === t.value ? "on" : ""} onClick={() => onChange(t.value)}>
          {t.icon}
          {t.label}
          {t.count != null && <span className="pc-badge">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export const Badge = ({ tone = "", children, className = "" }) => <span className={cn("pc-badge", tone, className)}>{children}</span>;

export function Avatar({ user, name, src, size = "", className = "" }) {
  const url = src ?? avatarUrl(user);
  const label = name ?? user?.name ?? user?.email ?? "?";
  return (
    <span className={cn("pc-avatar", size, className)} title={label}>
      {url ? <img src={url} alt={label} loading="lazy" referrerPolicy="no-referrer" /> : initials(label)}
    </span>
  );
}

export function AvatarStack({ users = [], max = 4, size = "sm" }) {
  const shown = users.slice(0, max);
  const extra = users.length - shown.length;
  return (
    <span className="pc-avatars">
      {shown.map((u, i) => (
        <Avatar key={u?._id ?? i} user={u} size={size} />
      ))}
      {extra > 0 && <span className={cn("pc-avatar more", size)}>+{extra}</span>}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="pc-empty">
      {Icon && (
        <span className="pc-ico">
          <Icon size={18} />
        </span>
      )}
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export const Skeleton = ({ h = 16, w = "100%", className = "" }) => <div className={cn("pc-skel", className)} style={{ height: h, width: w }} />;

export function Progress({ value, tone = "", className = "" }) {
  const pct = Math.max(0, Math.min(100, value || 0));
  return (
    <div className={cn("pc-progress", tone, className)} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <i style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Banner({ tone = "", icon: Icon, children, action }) {
  return (
    <div className={cn("pc-banner", tone)}>
      {Icon && <Icon size={15} />}
      <span style={{ flex: 1 }}>{children}</span>
      {action}
    </div>
  );
}

export function Field({ label, hint, error, children, className = "" }) {
  return (
    <div className={cn("pc-field", className)}>
      {label && <label>{label}</label>}
      {children}
      {error ? <span className="err">{error}</span> : hint ? <span className="hint">{hint}</span> : null}
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder = "Search", className = "", autoFocus }) {
  return (
    <label className={cn("pc-search", className)}>
      <Search size={14} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus} />
      {value && (
        <button type="button" className="pc-iconbtn" style={{ width: 22, height: 22 }} onClick={() => onChange("")} aria-label="Clear search">
          <X size={12} />
        </button>
      )}
    </label>
  );
}

export function CopyButton({ text, label = "Copy", className = "pc-btn sm" }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onClick={async (e) => {
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          /* clipboard unavailable (http / permissions) */
        }
        setOk(true);
        setTimeout(() => setOk(false), 1400);
      }}
    >
      {ok ? <Check size={13} /> : <Copy size={13} />}
      {ok ? "Copied" : label}
    </button>
  );
}

export function Button({ variant = "", size = "", loading = false, icon: Icon, children, className = "", ...rest }) {
  return (
    <button className={cn("pc-btn", variant, size, className)} disabled={loading || rest.disabled} {...rest}>
      {loading ? <Loader2 size={14} className="animate-spin" /> : Icon ? <Icon size={14} /> : null}
      {children}
    </button>
  );
}
