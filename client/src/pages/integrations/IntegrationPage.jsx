import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { AlertTriangle, Check, Unplug } from "lucide-react";
import { Layout } from "../../components/common-afterauth";
import ConnectCard from "../../components/integrations/ConnectCard";
import ProviderIcon from "../../components/integrations/ProviderIcon";
import { providerState } from "../../components/integrations/providerMeta";
import { GoogleCalendarPanel, GoogleDrivePanel, GoogleMeetPanel, GmailPanel } from "../../components/integrations/panels/GooglePanels";
import { ActionsPanel, GitHubPanel } from "../../components/integrations/panels/GitHubPanels";
import { JiraPanel, SlackPanel, TeamsPanel, TrelloPanel } from "../../components/integrations/panels/WorkPanels";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { integrationsApi } from "../../services/integrationsApi";
import { Avatar, Badge, Banner, Button, Card, CardHead, PageHead, Skeleton, timeAgo } from "../../components/ui";

const PANELS = {
  google_calendar: GoogleCalendarPanel,
  google_drive: GoogleDrivePanel,
  google_meet: GoogleMeetPanel,
  gmail: GmailPanel,
  github: GitHubPanel,
  github_actions: ActionsPanel,
  slack: SlackPanel,
  microsoft_teams: TeamsPanel,
  jira: JiraPanel,
  trello: TrelloPanel,
};

const IntegrationPage = () => {
  const { provider: providerId } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { currentWorkspace } = useWorkspace();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const workspaceId = currentWorkspace?._id;

  const load = useCallback(async () => {
    if (!workspaceId) return;
    try {
      setData(await integrationsApi.catalog(workspaceId));
    } catch (e) {
      setError(e.error || "Couldn't load this integration");
    }
  }, [workspaceId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (params.get("connected")) toast.success("Connected");
    if (params.get("error")) toast.error(params.get("error"), { duration: 6000 });
    if (params.get("connected") || params.get("error")) setParams({}, { replace: true });
  }, [params, setParams]);

  const provider = data?.providers.find((p) => p.id === providerId);
  const connection = provider?.connections[0];
  const Panel = PANELS[providerId];

  const reconnect = useCallback(async () => {
    if (provider?.auth === "oauth") {
      try {
        window.location.assign(await integrationsApi.connect(provider.id, workspaceId));
      } catch (e) {
        toast.error(e.error);
      }
    } else {
      setUpdating(true);
    }
  }, [provider, workspaceId]);

  const disconnect = async () => {
    if (!window.confirm(`Disconnect ${provider.name}? PlanCrest will stop syncing with it. Data already imported stays.`)) return;
    try {
      await integrationsApi.disconnect(connection._id);
      toast.success(`${provider.name} disconnected`);
      load();
    } catch (e) {
      toast.error(e.error);
    }
  };

  if (error) {
    return (
      <Layout>
        <div className="pc-page narrow">
          <Banner tone="error" icon={AlertTriangle} action={<Button size="sm" onClick={() => navigate("/integrations")}>Back</Button>}>{error}</Banner>
        </div>
      </Layout>
    );
  }
  if (data && !provider) {
    return (
      <Layout>
        <div className="pc-page narrow">
          <Banner tone="error" icon={AlertTriangle} action={<Button size="sm" onClick={() => navigate("/integrations")}>All integrations</Button>}>There's no integration called “{providerId}”.</Banner>
        </div>
      </Layout>
    );
  }
  if (!provider) {
    return (
      <Layout>
        <div className="pc-page">
          <Skeleton h={48} w="30%" />
          <Skeleton h={260} />
        </div>
      </Layout>
    );
  }

  const state = providerState(provider);
  const canDisconnect = connection && !provider.derivedFrom && (provider.scope === "personal" || provider.canManage);

  return (
    <Layout>
      <div className="pc-page">
        <PageHead
          crumbs={[{ label: "Integrations", to: "/integrations" }, { label: provider.name }]}
          title={<span className="inline-flex items-center gap-3"><ProviderIcon id={provider.id} size={34} />{provider.name}<Badge tone={state.tone}>{state.label}</Badge></span>}
          sub={provider.description}
        >
          {canDisconnect && <Button variant="danger" icon={Unplug} onClick={disconnect}>Disconnect</Button>}
        </PageHead>

        <div className="pc-split">
          <div className="pc-stack">
            {connection && !updating ? (
              <Panel connector={connection} onChanged={load} onReconnect={reconnect} />
            ) : (
              <ConnectCard provider={provider} workspaceId={workspaceId} onConnected={() => { setUpdating(false); load(); }} />
            )}
          </div>

          <div className="pc-stack">
            {connection && (
              <Card>
                <CardHead title="Connection" />
                <div style={{ display: "grid", gap: 10, fontSize: 13 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar src={connection.account?.picture} name={connection.account?.name || connection.name} />
                    <div style={{ minWidth: 0 }}>
                      <b style={{ fontWeight: 500, display: "block", overflow: "hidden", textOverflow: "ellipsis" }}>{connection.account?.name || connection.name}</b>
                      <span className="pc-dim" style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>{connection.account?.email || (connection.account?.username && `@${connection.account.username}`) || connection.account?.site}</span>
                    </div>
                  </div>
                  <div className="pc-dim" style={{ fontSize: 12 }}>
                    Connected {timeAgo(connection.connectedAt)}{connection.lastSync ? ` · last synced ${timeAgo(connection.lastSync)}` : ""}
                  </div>
                  {connection.status === "error" && <Banner tone="warn" icon={AlertTriangle}>{connection.stats?.lastSyncStatus || "Needs attention"}</Banner>}
                  {provider.auth !== "derived" && (
                    <div><Button size="sm" onClick={reconnect}>{provider.auth === "oauth" ? "Reconnect" : "Update credentials"}</Button></div>
                  )}
                </div>
              </Card>
            )}
            <Card>
              <CardHead title="What you can do" />
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 9 }}>
                {provider.features.map((f) => (
                  <li key={f} style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--sub)", lineHeight: 1.45 }}>
                    <Check size={14} style={{ color: "var(--green-t)", flex: "none", marginTop: 2 }} />
                    {f}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default IntegrationPage;
