import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Layout } from "../../components/common-afterauth";
import ProviderIcon from "../../components/integrations/ProviderIcon";
import { providerState } from "../../components/integrations/providerMeta";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { integrationsApi } from "../../services/integrationsApi";
import { Badge, Banner, Button, PageHead, Skeleton } from "../../components/ui";

const IntegrationsHub = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { currentWorkspace } = useWorkspace();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!currentWorkspace?._id) return;
    try {
      setError("");
      setData(await integrationsApi.catalog(currentWorkspace._id));
    } catch (e) {
      setError(e.error || "Couldn't load integrations");
    }
  }, [currentWorkspace?._id]);

  useEffect(() => {
    load();
  }, [load]);

  // The OAuth redirect lands here with ?error=… when something went wrong before a provider was known
  useEffect(() => {
    const message = params.get("error");
    if (message) {
      toast.error(message, { duration: 6000 });
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  const connectedCount = data?.providers.filter((p) => p.connections.length && !p.derivedFrom).length ?? 0;

  return (
    <Layout>
      <div className="pc-page">
        <PageHead title="Integrations" sub="Connect the tools your team already uses. Each one stays optional: only what you connect is used.">
          {data && <Badge tone={connectedCount ? "green" : ""}>{connectedCount} connected</Badge>}
        </PageHead>

        {error ? (
          <Banner tone="error" icon={AlertTriangle} action={<Button size="sm" onClick={load}>Retry</Button>}>{error}</Banner>
        ) : !data ? (
          <div className="pc-grid pc-cols-3">{[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} h={130} />)}</div>
        ) : (
          data.categories.map((category) => {
            const providers = data.providers.filter((p) => p.category === category.id);
            if (!providers.length) return null;
            return (
              <section key={category.id} style={{ display: "grid", gap: 10 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{category.name}</h2>
                  <p className="pc-dim" style={{ margin: "2px 0 0", fontSize: 12.5 }}>{category.description}</p>
                </div>
                <div className="pc-grid pc-cols-3">
                  {providers.map((p) => {
                    const state = providerState(p);
                    return (
                      <button key={p.id} className="pc-card pad hover" style={{ display: "grid", gap: 12, textAlign: "left", cursor: "pointer", font: "inherit", color: "inherit", alignContent: "start" }} onClick={() => navigate(`/integrations/${p.id}`)}>
                        <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <ProviderIcon id={p.id} />
                          <b style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>{p.name}</b>
                          <Badge tone={state.tone}>{state.label}</Badge>
                        </span>
                        <span className="pc-muted" style={{ fontSize: 12.5, lineHeight: 1.5 }}>{p.description}</span>
                        <span className="pc-link" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12.5 }}>
                          {p.connections.length ? "Manage" : "Set up"} <ArrowRight size={12} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}
      </div>
    </Layout>
  );
};

export default IntegrationsHub;
