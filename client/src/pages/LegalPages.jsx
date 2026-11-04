import { Link } from "react-router-dom";
import { BrandFooter, BrandNav } from "../components/brand/BrandNav";

function Legal({ title, updated, children }) {
  return (
    <div className="br">
      <BrandNav />
      <main id="main" className="br-wrap" style={{ maxWidth: 680, padding: "80px 24px" }}>
        <h1 style={{ fontSize: 36, margin: 0 }}>{title}</h1>
        <p className="br-sub" style={{ margin: "8px 0 40px" }}>Last updated {updated}</p>
        <div className="br-legal">{children}</div>
        <p style={{ marginTop: 48 }}><Link to="/">Back to home</Link></p>
      </main>
      <BrandFooter />
    </div>
  );
}

export function PrivacyPage() {
  return (
    <Legal title="Privacy policy" updated="1 November 2026">
      <p>PlanCrest is open source software. Whoever hosts an instance is responsible for the data stored in it. This page describes what the software itself stores, so operators can tell their users accurately.</p>
      <h2>What the app stores</h2>
      <p>Your name, email address, profile photo, the workspaces, projects, tasks, comments, files and messages you create, and the time you track. Passwords are stored as one way hashes. Tokens for connected services are encrypted before they are saved.</p>
      <h2>Cookies</h2>
      <p>PlanCrest sets one essential cookie that keeps you signed in. It does not use advertising or tracking cookies.</p>
      <h2>Third party services</h2>
      <p>If the operator turns them on, data is sent to the services you connect: Google, GitHub, Slack, Microsoft Teams, Jira, Trello, an email provider, Cloudinary for files, and OpenRouter for AI Mode. AI Mode sends the text of your request and the task details it looks up to the configured model.</p>
      <h2>Your choices</h2>
      <p>You can change your profile at any time in Settings. To export or delete your data, contact the person who runs your instance.</p>
    </Legal>
  );
}

export function TermsPage() {
  return (
    <Legal title="Terms of use" updated="1 November 2026">
      <p>PlanCrest is provided under the MIT license, without warranty of any kind. These terms describe how an instance may be used; operators can replace them with their own.</p>
      <h2>Your account</h2>
      <p>Keep your sign in details private and use the service lawfully. You are responsible for the content you add to your workspaces.</p>
      <h2>Acceptable use</h2>
      <p>Do not try to access other people's data, disrupt the service, or use it to send spam or malware.</p>
      <h2>Availability</h2>
      <p>The service is provided as is. The operator may change or stop it, and should give notice where practical.</p>
    </Legal>
  );
}
