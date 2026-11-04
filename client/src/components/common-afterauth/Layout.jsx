import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CalendarPlus, FolderPlus, ListPlus, Sparkles } from "lucide-react";
import TopBar from "../shell/TopBar";
import SideNav from "../shell/SideNav";
import CommandPalette from "../shell/CommandPalette";
import QuickTaskModal from "../shell/QuickTaskModal";
import EventModal from "../calendar/EventModal";
import {
  CreateProjectModal,
  CreateWorkspaceModal,
  InviteMemberModal,
  WorkspaceMembersModal,
} from "../modals";

/**
 * The signed-in app shell: top bar, labelled sidebar, and a scrolling main area.
 * Every page renders inside <Layout>. Pass `fill` for full-height pages like chat.
 */
const Layout = ({ children, fill = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [modal, setModalState] = useState(null); // "task" | "project" | "event" | "workspace" | "invite" | "members"
  const [modalProps, setModalProps] = useState({});
  const setModal = useCallback((name, props = {}) => {
    setModalState(name);
    setModalProps(props);
  }, []);
  const close = useCallback(() => setModalState(null), []);

  // Close the mobile drawer whenever the route changes
  useEffect(() => setNavOpen(false), [location.pathname]);

  // Pages can open shell modals with: window.dispatchEvent(new CustomEvent("pc:modal", { detail: "invite" }))
  useEffect(() => {
    // detail is a modal name, or { name, ...props } to pass options such as a projectId
    const onModal = (e) => (typeof e.detail === "string" ? setModal(e.detail) : setModal(e.detail?.name, e.detail));
    window.addEventListener("pc:modal", onModal);
    return () => window.removeEventListener("pc:modal", onModal);
  }, [setModal]);

  // Ctrl/Cmd+K opens the palette from anywhere
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const actions = [
    { label: "New task", hint: "Create", icon: ListPlus, run: () => setModal("task") },
    { label: "New project", hint: "Create", icon: FolderPlus, run: () => setModal("project") },
    { label: "New event", hint: "Create", icon: CalendarPlus, run: () => setModal("event") },
    { label: "Plan my day with AI", hint: "AI Mode", icon: Sparkles, run: () => navigate("/ai-mode") },
  ];


  return (
    <div className="pc-app">
      <TopBar
        onToggleNav={() => setNavOpen((o) => !o)}
        onSearch={() => setPaletteOpen(true)}
        onNewTask={() => setModal("task")}
        onNewProject={() => setModal("project")}
        onNewEvent={() => setModal("event")}
        onCreateWorkspace={() => setModal("workspace")}
        onInvite={() => setModal("invite")}
        onMembers={() => setModal("members")}
      />
      <div className="pc-body">
        <SideNav open={navOpen} onNavigate={() => setNavOpen(false)}/>
        <div className={`pc-scrim ${navOpen ? "open" : ""}`} onClick={() => setNavOpen(false)} />
        <main className={`pc-main ${fill ? "fill" : ""}`} id="main">
          {children}
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} actions={actions} />
      <QuickTaskModal open={modal === "task"} onClose={close} projectId={modalProps.projectId} />
      <CreateProjectModal isOpen={modal === "project"} onClose={close} />
      <EventModal open={modal === "event"} onClose={close} event={null} initialDate={new Date()} onChanged={() => window.dispatchEvent(new Event("pc:events"))} />
      <CreateWorkspaceModal isOpen={modal === "workspace"} onClose={close} />
      <InviteMemberModal isOpen={modal === "invite"} onClose={close} />
      <WorkspaceMembersModal isOpen={modal === "members"} onClose={close} />
    </div>
  );
};

export default Layout;
