import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { MailX, Users } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { rememberNext } from "../utils/redirect";
import AuthShell from "./brand/AuthShell";
import { Avatar, Button, Badge, Spinner } from "./ui";

/** Landing page for /invite/:token: shows who invited you and lets you join. */
export default function InvitationHandler() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { getInvitationDetails, acceptInvitation } = useWorkspace();
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    getInvitationDetails(token)
      .then((res) => live && setInvitation(res.data.invitation))
      .catch((err) => live && setError(err?.error || "This invitation can't be loaded."));
    return () => {
      live = false;
    };
  }, [token, getInvitationDetails]);

  const accept = async () => {
    setBusy(true);
    try {
      await acceptInvitation(token);
      navigate("/dashboard", { replace: true });
    } catch {
      setBusy(false);
    }
  };

  const remember = () => rememberNext(`/invite/${token}`);

  if (error) {
    return (
      <AuthShell title="Invitation unavailable" subtitle={error} back={{ to: "/", label: "Back to home" }}>
        <div className="pc-banner warn"><MailX size={16} /> Ask the person who invited you to send a new link.</div>
        <Link className="pc-btn primary" to={isAuthenticated ? "/dashboard" : "/login"} style={{ justifyContent: "center" }}>
          {isAuthenticated ? "Go to your dashboard" : "Sign in"}
        </Link>
      </AuthShell>
    );
  }

  if (!invitation) {
    return (
      <AuthShell title="Loading invitation…">
        <div style={{ display: "flex", justifyContent: "center", padding: 24 }}><Spinner /></div>
      </AuthShell>
    );
  }

  const wrongAccount = isAuthenticated && user?.email && invitation.email && user.email.toLowerCase() !== invitation.email.toLowerCase();

  return (
    <AuthShell
      title={`Join ${invitation.workspace?.name}`}
      subtitle={`${invitation.invitedBy?.name || "A teammate"} invited you as ${invitation.role}.`}
    >
      <div className="pc-card" style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar user={invitation.invitedBy} size="lg" />
          <div style={{ minWidth: 0 }}>
            <b style={{ display: "block" }}>{invitation.workspace?.name}</b>
            <span className="pc-dim" style={{ fontSize: 12 }}>{invitation.workspace?.description || "Workspace"}</span>
          </div>
          <Badge tone="blue"><Users size={11} /> {invitation.role}</Badge>
        </div>
        {invitation.message && <p className="pc-muted" style={{ margin: 0, fontSize: 13 }}>“{invitation.message}”</p>}
      </div>

      {isAuthenticated ? (
        <>
          {wrongAccount && <div className="pc-banner warn">This invite was sent to {invitation.email}, but you're signed in as {user.email}.</div>}
          <Button variant="primary" loading={busy} onClick={accept}>Accept and join</Button>
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>Not now</Button>
        </>
      ) : (
        <>
          <p className="pc-muted" style={{ margin: 0, fontSize: 13 }}>Sign in or create an account with <b>{invitation.email}</b> to accept.</p>
          <Link className="pc-btn primary" to="/login" onClick={remember} style={{ justifyContent: "center" }}>Sign in</Link>
          <Link className="pc-btn" to="/register" onClick={remember} style={{ justifyContent: "center" }}>Create an account</Link>
        </>
      )}
    </AuthShell>
  );
}
