import { Link } from "react-router-dom";
import { ArrowRight, CalendarBlank, ChatCircle, Kanban, ShieldCheck, Sparkle, Timer, PlugsConnected, GithubLogo } from "@phosphor-icons/react";
import { BrandFooter, BrandNav } from "../components/brand/BrandNav";
import { Reveal, TaglineReveal } from "../components/brand/Reveal";
import { REPO_URL } from "../config/site";

const FEATURES = [
  { icon: Kanban, title: "Boards, lists and timelines" },
  { icon: Timer, title: "Time, goals and automations" },
  { icon: CalendarBlank, title: "Calendar" },
  { icon: ChatCircle, title: "Chat on every task" },
  { icon: Sparkle, title: "AI that reads your work" },
  { icon: PlugsConnected, title: "GitHub, Slack, Google and more" },
];

const FAQ = [
  ["Is it free?", "Yes. PlanCrest is open source under the MIT license."],
  ["Where is my data?", "In your own MongoDB database. Nothing is sent to us."],
  ["Is AI required?", "No. Add an API key to turn it on."],
  ["Can I self host it?", "Yes. Run it with Docker or on any Node host."],
];

function Preview() {
  const cols = [
    ["To do", ["Design pricing page", "Set up analytics"]],
    ["In progress", ["Finalize homepage copy", "Push notifications"]],
    ["Done", ["Brand guidelines", "Choose CMS"]],
  ];
  return (
    <div className="br-shot" role="img" aria-label="PlanCrest board view">
      <div className="br-shot-bar">
        <i /><i /><i />
      </div>
      <div className="br-shot-body">
        <div className="br-shot-side">
          {["Overview", "My work", "Projects", "Calendar", "Chat"].map((l, i) => (
            <div key={l} className={i === 2 ? "on" : ""}>{l}</div>
          ))}
        </div>
        <div className="br-shot-main">
          <div className="br-shot-cols">
            {cols.map(([name, items]) => (
              <div key={name} className="br-shot-col">
                <h4><span>{name}</span><span className="pc-dim">{items.length}</span></h4>
                {items.map((t) => (
                  <div key={t} className="br-shot-card">{t}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="br">
      <BrandNav />
      <main id="main">
        <section className="br-hero">
          <div className="br-wrap">
            <h1>Plan the work.<br />Ship the thing.</h1>
            <div className="cta">
              <Link to="/register" className="br-btn primary">
                Start free <ArrowRight size={16} />
              </Link>
              <a href={REPO_URL} target="_blank" rel="noreferrer" className="br-btn soft">
                <GithubLogo size={16} /> GitHub
              </a>
            </div>
            <Preview />
          </div>
        </section>

        <div className="br-wrap">
          <TaglineReveal text="Every task, conversation and deadline in one calm place, so your team spends the week shipping instead of searching." />

          <Reveal as="section" className="br-section" id="features">
            <div className="br-features">
              {FEATURES.map(({ icon: Icon, title }) => (
                <article key={title} className="br-feature">
                  <div className="i"><Icon size={20} /></div>
                  <h3>{title}</h3>
                </article>
              ))}
            </div>
          </Reveal>

          <Reveal as="section" className="br-section" id="faq">
            <div className="br-faq">
              {FAQ.map(([q, a]) => (
                <details key={q}>
                  <summary>{q}</summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </Reveal>

          <section className="br-cta">
            <h2>Run your next project here</h2>
            <div className="cta">
              <Link to="/register" className="br-btn primary">Start free <ArrowRight size={16} /></Link>
            </div>
          </section>
        </div>
      </main>
      <BrandFooter />
    </div>
  );
}
