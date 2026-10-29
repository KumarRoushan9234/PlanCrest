import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { GithubLogo } from "@phosphor-icons/react";
import { Logo } from "../ui";
import { REPO_URL } from "../../config/site";

const LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#ai", label: "AI" },
  { href: "/#how", label: "How it works" },
  { href: "/#faq", label: "FAQ" },
];

export function BrandNav() {
  const [open, setOpen] = useState(false);
  const { pathname, hash } = useLocation();

  useEffect(() => setOpen(false), [pathname, hash]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <a href="#main" className="br-skip">Skip to content</a>
      <header className="br-nav">
        <div className="br-nav-in">
          <Link to="/" className="br-logo">
            <Logo size={28} />
            PlanCrest
          </Link>
          <nav className="br-links" aria-label="Primary">
            {LINKS.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}
          </nav>
          <div className="br-nav-cta">
            <a href={REPO_URL} className="br-btn soft sm" target="_blank" rel="noreferrer" aria-label="PlanCrest on GitHub">
              <GithubLogo size={16} />
              <span className="br-hide-sm">GitHub</span>
            </a>
            <Link to="/login" className="br-btn soft sm br-hide-sm">Sign in</Link>
            <Link to="/register" className="br-btn primary sm">Get started</Link>
            <button className={`br-burger ${open ? "open" : ""}`} onClick={() => setOpen((o) => !o)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}>
              <span /><span />
            </button>
          </div>
        </div>
      </header>

      <div className={`br-sheet ${open ? "open" : ""}`} aria-hidden={!open}>
        <nav aria-label="Mobile">
          {[...LINKS, { href: "/login", label: "Sign in", route: true }].map((l, i) =>
            l.route ? (
              <Link key={l.href} to={l.href} style={{ transitionDelay: `${Math.min(i * 60, 240)}ms` }} tabIndex={open ? 0 : -1}>{l.label}</Link>
            ) : (
              <a key={l.href} href={l.href} style={{ transitionDelay: `${Math.min(i * 60, 240)}ms` }} tabIndex={open ? 0 : -1}>{l.label}</a>
            )
          )}
        </nav>
      </div>
    </>
  );
}

export function BrandFooter() {
  return (
    <footer className="br-footer">
      <div className="br-wrap row">
        <span>© {new Date().getFullYear()} PlanCrest. Open source under the MIT license.</span>
        <span>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <a href={REPO_URL} target="_blank" rel="noreferrer">GitHub</a>
          <a href={`${REPO_URL}/issues`} target="_blank" rel="noreferrer">Issues</a>
          <Link to="/login">Sign in</Link>
        </span>
      </div>
    </footer>
  );
}
