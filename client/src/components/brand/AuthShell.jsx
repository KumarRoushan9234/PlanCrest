import { Link } from "react-router-dom";
import { ArrowLeft, Check, ChatCircle, Kanban, Sparkle } from "@phosphor-icons/react";
import { Contours, Logo } from "../ui";

const POINTS = [
  { icon: Kanban, text: "Boards, tasks and calendars that stay in sync" },
  { icon: ChatCircle, text: "Real-time chat attached to the work itself" },
  { icon: Sparkle, text: "An AI assistant that reads and updates your workspace" },
];

/** Split-screen frame shared by every auth page. */
export default function AuthShell({ title, subtitle, back, children, footer }) {
  return (
    <div className="br br-auth">
      <a href="#main" className="br-skip">Skip to content</a>
      <aside className="br-auth-art" aria-hidden="false">
        <Contours />
        <Link to="/" className="br-logo">
          <Logo size={30} />
          PlanCrest
        </Link>
        <div>
          <h2>Plan the work.<br />Ship the thing.</h2>
          <p>One calm workspace for projects, people and plans, open source and ready to self-host.</p>
          <ul className="br-auth-points">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text}>
                <span className="i">
                  <Icon size={15} />
                </span>
                <span style={{ paddingTop: 3 }}>{text}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="br-auth-quote" style={{ fontSize: 13, color: "#7c7d8e" }}>
          <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
            <Check size={14} color="#00ddb3" /> Free and open source under MIT
          </span>
        </div>
      </aside>

      <main id="main" className="br-auth-main">
        <div className="br-auth-card">
          <Link to="/" className="br-logo br-mobile-logo">
            <Logo size={26} />
            PlanCrest
          </Link>
          {back && (
            <Link to={back.to} className="br-back">
              <ArrowLeft size={14} /> {back.label}
            </Link>
          )}
          <div style={{ display: "grid", gap: 8 }}>
            <h1>{title}</h1>
            {subtitle && <p className="br-sub" style={{ margin: 0 }}>{subtitle}</p>}
          </div>
          {children}
          {footer && <div className="br-foot">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
