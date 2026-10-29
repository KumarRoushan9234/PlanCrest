import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Bell, Camera, Eye, EyeOff, Lock, Monitor, Moon, Palette, Sun, User } from "lucide-react";
import Layout from "../components/common-afterauth/Layout";
import { useAuth } from "../contexts/AuthContext";
import { notificationService, uploadService } from "../services";
import { getThemePreference, setThemePreference } from "../utils/theme";
import { Avatar, Badge, Button, Card, CardHead, Field, PageHead, Tabs } from "../components/ui";

const DEFAULT_NOTIFICATIONS = {
  email: { taskAssigned: true, taskDue: true, taskCompleted: false, comments: true, mentions: true, projectCreated: true, deadlineReminder: true, eventReminder: true },
  inApp: { taskAssigned: true, taskDue: true, taskCompleted: true, mentions: true, comments: true, deadlineReminder: true, eventReminder: true, projectInvite: true },
  push: { taskAssigned: true, taskCompleted: false, projectInvite: true, workspaceInvite: true, deadlineReminder: true, eventReminder: true },
};

const NOTIFICATION_LABELS = {
  taskAssigned: ["Task assigned to me", "When someone assigns you a task."],
  taskDue: ["Task due soon", "When a task you own is about to be due."],
  taskCompleted: ["Task completed", "When a task you follow is marked done."],
  comments: ["Comments", "New comments on tasks you follow."],
  mentions: ["Mentions", "When someone @mentions you."],
  projectCreated: ["New projects", "When a project is created in your workspace."],
  projectInvite: ["Project invitations", "When you're added to a project."],
  deadlineReminder: ["Deadline reminders", "A heads-up before a deadline."],
  eventReminder: ["Event reminders", "A heads-up before calendar events."],
};

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

const PasswordField = ({ label, value, onChange, autoComplete, hint }) => {
  const [show, setShow] = useState(false);
  return (
    <Field label={label} hint={hint}>
      <div style={{ position: "relative" }}>
        <input className="pc-input" type={show ? "text" : "password"} value={value} onChange={onChange} autoComplete={autoComplete} style={{ paddingRight: 36 }} />
        <button type="button" className="pc-btn ghost icon sm" style={{ position: "absolute", right: 4, top: 4 }} onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"}>
          {show ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
      </div>
    </Field>
  );
};

const Switch = ({ checked, onChange, label }) => (
  <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={onChange}
    style={{ width: 34, height: 20, borderRadius: 10, border: "1px solid var(--line)", background: checked ? "var(--blue, #4d8dff)" : "var(--panel2, var(--panel))", position: "relative", flexShrink: 0, cursor: "pointer", padding: 0 }}>
    <span style={{ position: "absolute", top: 2, left: checked ? 16 : 2, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "left .15s" }} />
  </button>
);

const ProfileSettingsPage = () => {
  const { user, updateProfile, changePassword, setUserData } = useAuth();
  const [tab, setTab] = useState("profile");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [theme, setTheme] = useState(getThemePreference);
  const [profile, setProfile] = useState({ name: user?.name || "", gender: user?.gender || "not specified" });
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);
  const fileRef = useRef(null);

  useEffect(() => {
    setProfile({ name: user?.name || "", gender: user?.gender || "not specified" });
  }, [user?.name, user?.gender]);

  useEffect(() => {
    if (tab !== "notifications") return;
    notificationService
      .getNotificationSettings()
      .then((res) => res?.data && setNotifications({ ...DEFAULT_NOTIFICATIONS, ...res.data }))
      .catch(() => {});
  }, [tab]);

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!profile.name.trim()) return toast.error("Name can't be empty");
    setSaving(true);
    try {
      await updateProfile({ ...profile, name: profile.name.trim() });
      toast.success("Profile updated");
    } catch {
      // the auth context already surfaces the error
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (passwords.next.length < 8) return toast.error("The new password must be at least 8 characters");
    if (passwords.next !== passwords.confirm) return toast.error("The new passwords don't match");
    setSaving(true);
    try {
      await changePassword({ currentPassword: passwords.current, newPassword: passwords.next });
      toast.success("Password changed");
      setPasswords({ current: "", next: "", confirm: "" });
    } catch {
      // the auth context already surfaces the error
    } finally {
      setSaving(false);
    }
  };

  const saveNotifications = async () => {
    setSaving(true);
    try {
      await notificationService.updateNotificationSettings(notifications);
      toast.success("Notification preferences saved");
    } catch {
      toast.error("Couldn't save notification preferences");
    } finally {
      setSaving(false);
    }
  };

  const toggle = (group, key) => setNotifications((n) => ({ ...n, [group]: { ...n[group], [key]: !n[group][key] } }));

  const uploadAvatar = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Choose an image file");
    if (file.size > 5 * 1024 * 1024) return toast.error("The image must be under 5 MB");
    setUploading(true);
    try {
      const res = await uploadService.uploadProfilePhoto(file);
      if (res?.success && res?.data?.user) {
        setUserData(res.data.user);
        toast.success("Profile photo updated");
      } else {
        toast.error("Couldn't update your photo");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Couldn't upload the photo");
    } finally {
      setUploading(false);
    }
  };

  const pickTheme = (value) => {
    setTheme(value);
    setThemePreference(value);
  };

  const groupRows = (group) =>
    Object.keys(notifications[group] || {})
      .filter((key) => NOTIFICATION_LABELS[key])
      .map((key) => (
        <div key={key} className="pc-row" style={{ cursor: "default", justifyContent: "space-between" }}>
          <span className="grow"><b>{NOTIFICATION_LABELS[key][0]}</b><small>{NOTIFICATION_LABELS[key][1]}</small></span>
          <Switch checked={Boolean(notifications[group][key])} onChange={() => toggle(group, key)} label={NOTIFICATION_LABELS[key][0]} />
        </div>
      ));

  return (
    <Layout>
      <div className="pc-page" style={{ maxWidth: 760 }}>
        <PageHead title="Settings" sub="Your profile, appearance, security and notifications." />
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "profile", label: "Profile", icon: <User size={13} /> },
            { value: "appearance", label: "Appearance", icon: <Palette size={13} /> },
            { value: "security", label: "Security", icon: <Lock size={13} /> },
            { value: "notifications", label: "Notifications", icon: <Bell size={13} /> },
          ]}
        />

        {tab === "profile" && (
          <Card>
            <CardHead icon={User} title="Profile" />
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
              <Avatar user={user} size="xl" />
              <div>
                <Button icon={Camera} loading={uploading} onClick={() => fileRef.current?.click()}>Change photo</Button>
                <div className="pc-dim" style={{ marginTop: 6 }}>JPG, PNG or GIF up to 5 MB.</div>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={uploadAvatar} />
              </div>
            </div>
            <form onSubmit={saveProfile} style={{ display: "grid", gap: 14 }}>
              <Field label="Full name"><input className="pc-input" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} maxLength={80} /></Field>
              <Field label="Email" hint="Your email is your sign-in and can't be changed here.">
                <input className="pc-input" value={user?.email || ""} disabled />
              </Field>
              <Field label="Gender">
                <select className="pc-select" value={profile.gender} onChange={(e) => setProfile((p) => ({ ...p, gender: e.target.value }))}>
                  <option value="not specified">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </Field>
              <div><Button variant="primary" type="submit" loading={saving}>Save changes</Button></div>
            </form>
          </Card>
        )}

        {tab === "appearance" && (
          <Card>
            <CardHead icon={Palette} title="Theme" />
            <p className="pc-muted" style={{ marginTop: 0 }}>Choose how PlanCrest looks. System follows your device setting.</p>
            <div className="pc-grid pc-cols-3">
              {THEMES.map(({ value, label, icon: Icon }) => (
                <button key={value} type="button" className={`pc-chip ${theme === value ? "on" : ""}`} style={{ justifyContent: "center", padding: "18px 10px", flexDirection: "column", gap: 8 }} aria-pressed={theme === value} onClick={() => pickTheme(value)}>
                  <Icon size={18} />
                  {label}
                </button>
              ))}
            </div>
          </Card>
        )}

        {tab === "security" && (
          <Card>
            <CardHead icon={Lock} title="Change password" />
            {user?.authProvider === "google" || user?.googleId ? (
              <p className="pc-muted" style={{ margin: 0 }}>You sign in with Google, so there's no PlanCrest password to change.</p>
            ) : (
              <form onSubmit={savePassword} style={{ display: "grid", gap: 14 }}>
                <PasswordField label="Current password" value={passwords.current} autoComplete="current-password" onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))} />
                <PasswordField label="New password" hint="At least 8 characters." value={passwords.next} autoComplete="new-password" onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))} />
                <PasswordField label="Confirm new password" value={passwords.confirm} autoComplete="new-password" onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))} />
                <div><Button variant="primary" type="submit" loading={saving} disabled={!passwords.current || !passwords.next}>Update password</Button></div>
              </form>
            )}
          </Card>
        )}

        {tab === "notifications" && (
          <div style={{ display: "grid", gap: 16 }}>
            <Card>
              <CardHead icon={Bell} title="In-app"><Badge>Bell menu</Badge></CardHead>
              <div style={{ display: "grid", gap: 2 }}>{groupRows("inApp")}</div>
            </Card>
            <Card>
              <CardHead icon={Bell} title="Email"><Badge>Inbox</Badge></CardHead>
              <div style={{ display: "grid", gap: 2 }}>{groupRows("email")}</div>
            </Card>
            <div><Button variant="primary" loading={saving} onClick={saveNotifications}>Save preferences</Button></div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProfileSettingsPage;
