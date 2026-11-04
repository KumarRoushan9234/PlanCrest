import { useCallback, useEffect, useState } from "react";
import { Activity, AlertTriangle } from "lucide-react";
import { Layout } from "../../components/common-afterauth";
import TeamNav from "../../components/shell/TeamNav";
import ActivityFeed from "../../components/activity/ActivityFeed";
import { useProject } from "../../contexts/ProjectContext";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { activityService } from "../../services";
import { Banner, Button, Card, EmptyState, PageHead, Skeleton } from "../../components/ui";

const TYPES = [
  { value: "", label: "All activity" },
  { value: "Task", label: "Tasks" },
  { value: "Project", label: "Projects" },
  { value: "Document", label: "Documents" },
  { value: "Comment", label: "Comments" },
  { value: "ChatChannel", label: "Channels" },
];

const ActivityPage = () => {
  const { currentWorkspace, workspaceMembers } = useWorkspace();
  const { projects } = useProject();
  const [items, setItems] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ type: "", userId: "", projectId: "" });

  const query = useCallback(
    (before) => {
      const q = { limit: 30 };
      if (filters.type) q.type = filters.type;
      if (filters.userId) q.userId = filters.userId;
      if (filters.projectId) q.projectId = filters.projectId;
      if (before) q.before = before;
      return activityService.getWorkspaceActivity(currentWorkspace._id, q);
    },
    [currentWorkspace?._id, filters]
  );

  useEffect(() => {
    if (!currentWorkspace?._id) return;
    let alive = true;
    setItems(null);
    setError("");
    query()
      .then((res) => {
        if (!alive) return;
        setItems(res.data || []);
        setCursor(res.nextCursor || null);
      })
      .catch((e) => alive && setError(e?.error || "Couldn't load activity."));
    return () => {
      alive = false;
    };
  }, [currentWorkspace?._id, query]);

  const more = async () => {
    setLoadingMore(true);
    try {
      const res = await query(cursor);
      setItems((list) => [...list, ...(res.data || [])]);
      setCursor(res.nextCursor || null);
    } catch (e) {
      setError(e?.error || "Couldn't load more.");
    } finally {
      setLoadingMore(false);
    }
  };

  const set = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));
  const filtered = Boolean(filters.type || filters.userId || filters.projectId);

  return (
    <Layout>
      <div className="pc-page narrow">
        <PageHead title="Activity" />

        <div className="pc-toolbar">
          <select className="pc-select" style={{ width: "auto" }} value={filters.type} onChange={set("type")} aria-label="Filter by type">
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select className="pc-select" style={{ width: "auto" }} value={filters.projectId} onChange={set("projectId")} aria-label="Filter by project">
            <option value="">All projects</option>
            {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
          <select className="pc-select" style={{ width: "auto" }} value={filters.userId} onChange={set("userId")} aria-label="Filter by person">
            <option value="">Everyone</option>
            {workspaceMembers.map((m) => m.user && <option key={m.user._id} value={m.user._id}>{m.user.name}</option>)}
          </select>
          {filtered && <Button variant="ghost" size="sm" onClick={() => setFilters({ type: "", userId: "", projectId: "" })}>Clear</Button>}
        </div>

        {error ? (
          <Banner tone="error" icon={AlertTriangle}>{error}</Banner>
        ) : items === null ? (
          <Skeleton h={320} />
        ) : items.length === 0 ? (
          <Card>
            <EmptyState icon={Activity} title={filtered ? "Nothing matches these filters" : "No activity yet"}>
              {filtered ? "Try clearing a filter." : "As your team creates, moves and comments on work, it shows up here."}
            </EmptyState>
          </Card>
        ) : (
          <Card>
            <ActivityFeed items={items} showProject />
            {cursor && (
              <div style={{ textAlign: "center", marginTop: 14 }}>
                <Button loading={loadingMore} onClick={more}>Load more</Button>
              </div>
            )}
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default ActivityPage;
