import { useState } from "react";
import toast from "react-hot-toast";
import { ArrowRight, Info, KeyRound, Link2, Server, Webhook } from "lucide-react";
import { Link } from "react-router-dom";
import { integrationsApi } from "../../services/integrationsApi";
import { Badge, Banner, Button, Card, CardHead, CopyButton, Field, Seg } from "../ui";
import { GUIDE_FOR, SETUP_GUIDES } from "./setupGuides";

/** Everything a provider needs before it is connected: setup help, the connect button, or a credentials form. */
export default function ConnectCard({ provider, workspaceId, onConnected }) {
  const [mode, setMode] = useState(provider.altAuth ? "oauth" : provider.auth);
  const [fields, setFields] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const guide = SETUP_GUIDES[GUIDE_FOR[provider.id]];
  const needsServerSetup = mode === "oauth" && !provider.configured;

  if (provider.derivedFrom) {
    return (
      <Card>
        <CardHead icon={Link2} title="Connect GitHub first" />
        <p className="pc-muted" style={{ margin: "0 0 14px" }}>{provider.name} uses your GitHub connection to read workflow runs. Connect GitHub, then come back here.</p>
        <Link to="/integrations/github" className="pc-btn primary">Go to GitHub <ArrowRight size={14} /></Link>
      </Card>
    );
  }

  if (provider.scope === "workspace" && !provider.canManage) {
    return (
      <Card>
        <EmptyState2 title={`${provider.name} isn't connected`}>Only a workspace owner or admin can connect this. Ask one of them to set it up.</EmptyState2>
      </Card>
    );
  }

  const start = async () => {
    setBusy(true);
    setError("");
    try {
      window.location.assign(await integrationsApi.connect(provider.id, workspaceId));
    } catch (e) {
      setError(e.error);
      setBusy(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await integrationsApi.connectWithCredentials(provider.id, workspaceId, fields);
      toast.success(`${provider.name} connected`);
      onConnected();
    } catch (err) {
      setError(err.error);
    } finally {
      setBusy(false);
    }
  };

  const credentialFields = mode === "webhook" ? [{ key: "webhookUrl", label: "Webhook URL", placeholder: provider.webhookHint, secret: true }] : provider.fields || [];

  return (
    <div className="pc-stack">
      {provider.altAuth && (
        <Seg value={mode} onChange={setMode} options={[{ value: "oauth", label: "Slack app" }, { value: "webhook", label: "Use a webhook URL" }]} />
      )}

      {mode === "oauth" ? (
        <Card glow={provider.configured}>
          <CardHead icon={Link2} title={`Connect ${provider.name}`}>
            {provider.configured ? <Badge tone="green">Server configured</Badge> : <Badge tone="amber">Server setup needed</Badge>}
          </CardHead>
          <p className="pc-muted" style={{ margin: "0 0 14px" }}>
            {provider.scope === "personal" ? "You'll sign in with your own account and approve access." : "Authorize PlanCrest for your whole workspace."}
          </p>
          <Button variant="primary" icon={Link2} loading={busy} disabled={needsServerSetup} onClick={start}>Connect {provider.name}</Button>
          {error && <div style={{ marginTop: 12 }}><Banner tone="error">{error}</Banner></div>}
        </Card>
      ) : (
        <Card>
          <CardHead icon={mode === "webhook" ? Webhook : KeyRound} title={mode === "webhook" ? "Paste a webhook URL" : `Connect ${provider.name}`} />
          {provider.help && <p className="pc-muted" style={{ margin: "0 0 14px" }}>{provider.help}</p>}
          <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
            {credentialFields.map((f) => (
              <Field key={f.key} label={f.label}>
                <input
                  className="pc-input"
                  type={f.secret ? "password" : "text"}
                  autoComplete="off"
                  placeholder={f.placeholder}
                  value={fields[f.key] || ""}
                  onChange={(e) => setFields((v) => ({ ...v, [f.key]: e.target.value }))}
                  required
                />
              </Field>
            ))}
            {error && <Banner tone="error">{error}</Banner>}
            <div><Button type="submit" variant="primary" loading={busy}>Connect</Button></div>
          </form>
          <p className="pc-dim" style={{ margin: "12px 0 0", fontSize: 12 }}>Your credentials are validated, then stored encrypted on your server. They're never shown again.</p>
        </Card>
      )}

      {needsServerSetup && guide && (
        <Card>
          <CardHead icon={Server} title={guide.title} tone="amber" />
          <Banner tone="warn" icon={Info}>
            This server doesn't have {provider.missingEnv.join(" and ")} yet.
          </Banner>
          <ol style={{ margin: "14px 0", paddingLeft: 20, display: "grid", gap: 8, color: "var(--sub)", fontSize: 13, lineHeight: 1.55 }}>
            {guide.steps.map((s) => <li key={s}>{s}</li>)}
          </ol>
          <Field label="Redirect URI to register">
            <div style={{ display: "flex", gap: 8 }}>
              <code className="pc-mono" style={{ flex: 1, padding: "8px 10px", border: "1px solid var(--line-2)", borderRadius: 6, overflowX: "auto", whiteSpace: "nowrap" }}>{provider.redirectUri}</code>
              <CopyButton text={provider.redirectUri} />
            </div>
          </Field>
          <p className="pc-dim" style={{ margin: "10px 0 0", fontSize: 12 }}>If your API runs on a different address, set API_PUBLIC_URL in server/.env and the URI above updates.</p>
        </Card>
      )}
    </div>
  );
}

function EmptyState2({ title, children }) {
  return (
    <div className="pc-empty">
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
