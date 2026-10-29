/* eslint-disable react-refresh/only-export-components */
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useProject } from "../../contexts/ProjectContext";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { integrationsApi } from "../../services/integrationsApi";
import { Banner } from "../ui";
import { AlertTriangle } from "lucide-react";

/** Run provider actions for a connection, injecting the current workspace and handling "reconnect". */
export function useConnectorActions(connector) {
  const { currentWorkspace } = useWorkspace();
  const [needsReconnect, setNeedsReconnect] = useState(connector.status === "error");
  const workspaceId = currentWorkspace?._id;

  const run = useCallback(
    async (action, params = {}, { silent = false } = {}) => {
      try {
        return await integrationsApi.run(connector._id, action, { workspaceId, ...params });
      } catch (error) {
        if (error.reconnect) setNeedsReconnect(true);
        if (!silent) toast.error(error.error || "That didn't work");
        throw error;
      }
    },
    [connector._id, workspaceId]
  );

  return { run, workspaceId, needsReconnect };
}

/** Load data from an async function; re-runs when `deps` change. */
export function useAsync(fn, deps) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const alive = useRef(true);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fnRef.current();
      if (alive.current) setState({ data, loading: false, error: null });
    } catch (error) {
      if (alive.current) setState({ data: null, loading: false, error });
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    load();
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ...state, reload: load };
}

export function ProjectSelect({ value, onChange, placeholder = "Choose a project", className = "" }) {
  const { projects } = useProject();
  return (
    <select className={`pc-select ${className}`} value={value || ""} onChange={(e) => onChange(e.target.value)} aria-label="PlanCrest project">
      <option value="">{placeholder}</option>
      {projects.map((p) => (
        <option key={p._id} value={p._id}>
          {p.name} ({p.key})
        </option>
      ))}
    </select>
  );
}

export function ReconnectBanner({ show, onReconnect }) {
  if (!show) return null;
  return (
    <Banner tone="warn" icon={AlertTriangle} action={<button className="pc-btn sm" onClick={onReconnect}>Reconnect</button>}>
      The connection was rejected by the provider. Reconnect to keep syncing.
    </Banner>
  );
}

export const ErrorLine = ({ error }) => (error ? <Banner tone="error" icon={AlertTriangle}>{error.error || error.message}</Banner> : null);

export const fmtDateTime = (value) =>
  value ? new Date(value).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "";

export const fmtDuration = (ms) => {
  if (ms == null || ms < 0) return "–";
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
};
