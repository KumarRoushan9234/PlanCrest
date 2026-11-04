import { Link } from "react-router-dom";
import { ArrowLeft } from "@phosphor-icons/react";
import { Logo } from "../ui";

/** One centered card shared by every auth page. */
export default function AuthShell({ title, back, children, footer }) {
  return (
    <div className="br br-auth">
      <a href="#main" className="br-skip">Skip to content</a>
      <main id="main" className="br-auth-main">
        <div className="br-auth-card">
          <Link to="/" className="br-logo" aria-label="PlanCrest home">
            <Logo size={28} />
            PlanCrest
          </Link>
          {back && (
            <Link to={back.to} className="br-back">
              <ArrowLeft size={14} /> {back.label}
            </Link>
          )}
          <h1>{title}</h1>
          {children}
          {footer && <div className="br-foot">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
