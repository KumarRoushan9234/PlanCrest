import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarBlank,
  ChatCircle,
  Check,
  EnvelopeSimple,
  FileText,
  GithubLogo,
  Kanban,
  PlugsConnected,
  ShieldCheck,
  Sparkle,
  Timer,
  UsersThree,
  VideoCamera,
} from "@phosphor-icons/react";
import { Contours } from "../components/ui";
import { BrandFooter, BrandNav } from "../components/brand/BrandNav";
import { Reveal, TaglineReveal } from "../components/brand/Reveal";
import { REPO_URL } from "../config/site";

const FEATURES = [
  { icon: Kanban, tone: "", title: "Projects and boards", text: "Boards you drag between columns, with subtasks, labels, priorities and due dates. Every project gets its own chat channel." },
  { icon: ChatCircle, tone: "lav", title: "Team chat attached to the work", text: "Channels, threads, reactions, mentions and file sharing, with a discussion attached to every task." },
  { icon: CalendarBlank, tone: "mint", title: "Calendar and scheduling", text: "Plan events, check availability and sync with Google Calendar so deadlines and meetings live together." },
  { icon: FileText, tone: "pink", title: "Documents", text: "Upload, preview, rename and share files inside the workspace, with access that follows your projects." },
  { icon: Timer, tone: "", title: "Time, goals and automations", text: "Track time from any task, set goals with measurable targets, and let rules assign, tag or notify when work changes status." },
  { icon: ShieldCheck, tone: "lav", title: "Roles and permissions", text: "Owners, admins, members and clients. Project access is enforced on the server, not just hidden in the UI." },
];

const STEPS = [
  { title: "Create a workspace", text: "Name it, invite your team, and pick a template or start from a blank board." },
  { title: "Plan the work", text: "Break projects into tasks, assign owners, set dates and watch progress roll up." },
  { title: "Collaborate and ship", text: "Talk in context, review in one place, and let the AI assistant handle the busywork." },
];

const FAQ = [
  ["Is PlanCrest really free?", "Yes. PlanCrest is open source under the MIT license. Run it yourself with your own MongoDB database and email account."],
  ["Do I need the AI features?", "No. AI Mode is optional. It turns on when you add an OpenRouter key and a model name to the server settings. Everything else works without it."],
  ["What can the AI assistant do?", "It can look up your projects and tasks, plan your day from your open work, break a task into subtasks, and create tasks when you ask. It only sees what you can already access."],
  ["Which integrations are supported?", "Google Calendar, Drive, Meet and Gmail, GitHub and GitHub Actions, Slack, Microsoft Teams, Jira and Trello. You connect each one from inside the app."],
  ["Can I self host it?", "Yes. The repository includes a Docker Compose setup and environment templates, so you can have it running in a few minutes."],
  ["Where is my data stored?", "In the MongoDB database you point the server at. Files go to Cloudinary if you configure it. Nothing is sent to PlanCrest, because there is no central PlanCrest service."],
  ["Which AI model does it use?", "Whichever model you name in the server settings. AI Mode runs through OpenRouter, so you can switch models by changing one line and restarting."],
  ["How do roles and permissions work?", "Workspace owners and admins manage everything. Members see the projects they belong to. Clients get read only access unless you allow more. Access is checked on the server for every request."],
  ["Can I track time and set goals?", "Yes. Start a timer on any task, log time by hand, review a timesheet, and set goals whose progress comes from tasks and numbers you choose."],
];

function Preview() {
  const cols = [
    ["To do", ["Design pricing page", "Set up analytics events"], "2"],
    ["In progress", ["Finalize homepage copy", "Push notifications"], "2"],
    ["Done", ["Brand guidelines v2", "Choose CMS"], "2"],
  ];
  return (
    <div className="br-shot" role="img" aria-label="Preview of the PlanCrest board view">
      <div className="br-shot-bar">
        <i /><i /><i />
        <span>app.plancrest.dev / Website Relaunch</span>
      </div>
      <div className="br-shot-body">
        <div className="br-shot-side">
          {["Overview", "My work", "Projects", "Calendar", "Chat", "AI Mode"].map((l, i) => (
            <div key={l} className={i === 2 ? "on" : ""}>{l}</div>
          ))}
        </div>
        <div className="br-shot-main">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <b style={{ fontSize: 15 }}>Website Relaunch</b>
            <span className="pc-badge blue">WEB · 8 tasks</span>
          </div>
          <div className="br-shot-cols">
            {cols.map(([name, items, n]) => (
              <div key={name} className="br-shot-col">
                <h4><span>{name}</span><span className="pc-dim">{n}</span></h4>
                {items.map((t, i) => (
                  <div key={t} className="br-shot-card">
                    {t}
                    <small>
                      <span style={{ color: i ? "#9ea2ae" : "#e8a93a" }}>{i ? "Medium" : "High"}</span>
                      <span className="pc-avatar sm" style={{ width: 18, height: 18, fontSize: 8 }}>{i ? "JL" : "PS"}</span>
                    </small>
                  </div>
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
        <Contours />
        <div className="br-wrap">
          <a href="#ai" className="br-pill">
            <i><Sparkle size={12} /></i>
            New: an AI assistant that works inside your workspace
          </a>
          <h1>
            Plan the work.<br />
            Ship the thing.
          </h1>
          <p className="lead">
            PlanCrest brings projects, tasks, calendars, chat and documents into one open source workspace, with an AI assistant that reads and updates your work for you.
          </p>
          <div className="cta">
            <Link to="/register" className="br-btn primary">
              Start free <ArrowRight size={16} />
            </Link>
            <a href={REPO_URL} target="_blank" rel="noreferrer" className="br-btn soft">
              <GithubLogo size={16} /> Star on GitHub
            </a>
          </div>
          <p className="fine">Open source under MIT. Runs on your own MongoDB. No credit card, no trial clock.</p>
          <Preview />
        </div>
      </section>

      <div className="br-wrap">
        <Reveal as="section" className="br-section" id="features">
          <span className="br-eyebrow">Everything in one place</span>
          <h2>Your team's tools, finally in sync</h2>
          <p className="sub">Tasks, conversations, files and dates link to each other, so you stop hunting for the last version of anything.</p>
          <div className="br-features">
            {FEATURES.map(({ icon: Icon, tone, title, text }) => (
              <article key={title} className="br-feature">
                <div className={`i ${tone}`}><Icon size={19} /></div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </Reveal>

        <TaglineReveal text="Every task, conversation and deadline in one calm place, so your team spends the week shipping instead of searching." />

        <section className="br-band" id="ai">
          <div>
            <span className="br-eyebrow">AI Mode</span>
            <h2 style={{ fontSize: "clamp(28px,3.4vw,38px)", fontWeight: 800, lineHeight: 1.1, maxWidth: 520 }}>An assistant that already knows your workspace</h2>
            <p className="sub" style={{ marginTop: 0, fontSize: 15.5 }}>Runs on the model you choose through OpenRouter. It uses your real projects and tasks, respects your permissions, and tells you what it did.</p>
            <ul>
              {["Ask what's overdue or what to focus on today", "Plan your day from your open, assigned work", "Break any task into clear subtasks in one click", "Create tasks from a sentence, with a link to each one"].map((t) => (
                <li key={t}><Check size={16} />{t}</li>
              ))}
            </ul>
          </div>
          <div className="br-chat" aria-hidden="true">
            <div className="br-bubble u">What should I focus on today?</div>
            <div className="br-bubble a">
              You have 2 tasks due soon. Start with <b>WEB-1 Finalize homepage copy</b> (due tomorrow, in review), then <b>MKT-3 Webinar slides</b> on Friday.
            </div>
            <div className="br-bubble u">Create a task to book the venue, due Friday</div>
            <div className="br-bubble a">Created <b>MKT-6 Book the venue</b> in Marketing Q4, due Friday.</div>
          </div>
        </section>

        <Reveal as="section" className="br-section" id="how">
          <span className="br-eyebrow">How it works</span>
          <h2>From idea to shipped in three steps</h2>
          <div className="br-steps">
            {STEPS.map((s) => (
              <div key={s.title} className="br-step">
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal as="section" className="br-section">
          <span className="br-eyebrow">Integrations</span>
          <h2>Connects to the tools you already use</h2>
          <div className="br-integrations">
            {[[CalendarBlank, "Google Calendar"], [FileText, "Google Drive"], [VideoCamera, "Google Meet"], [EnvelopeSimple, "Gmail"], [GithubLogo, "GitHub Actions"], [ChatCircle, "Slack"], [UsersThree, "Microsoft Teams"], [Kanban, "Jira"], [PlugsConnected, "Trello"]].map(([Icon, name]) => (
              <span key={name} className="br-int"><Icon size={16} />{name}</span>
            ))}
          </div>
        </Reveal>

        <Reveal as="section" className="br-section" id="faq">
          <span className="br-eyebrow">FAQ</span>
          <h2>Questions people ask</h2>
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
          <Contours opacity={0.7} />
          <div style={{ position: "relative" }}>
            <h2>Run your next project here</h2>
            <p>Create a workspace in about a minute, or clone the repo and host it yourself. If it is not a fit, export nothing and delete nothing: your data stays in your own database.</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link to="/register" className="br-btn primary">Start free <ArrowRight size={16} /></Link>
              <a href={REPO_URL} target="_blank" rel="noreferrer" className="br-btn soft"><GithubLogo size={16} /> View source</a>
            </div>
          </div>
        </section>
      </div>

      </main>

      <BrandFooter />
    </div>
  );
}
