import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Bell, Globe, Lock, Palette, User, LogOut, ChevronRight, Loader2, Check, X, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchUser, logoutUser, updateProfile } from "@/lib/api";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — ReccoFlix" }] }),
  component: SettingsPage,
});

const tabs = [
  { key: "account", label: "Account", icon: User },
  { key: "appearance", label: "Appearance", icon: Palette },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "privacy", label: "Privacy", icon: Lock },
  { key: "language", label: "Language", icon: Globe },
] as const;

function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUser()
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        navigate({ to: "/login" });
      });
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutUser();
      navigate({ to: "/" });
    } catch (err) {
      console.error("Logout failed:", err);
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header>
        <h1 className="text-3xl font-extrabold sm:text-4xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your ReccoFlix account and security.</p>
      </header>

      <div className="grid gap-6">
        <section className="glass-strong rounded-3xl p-6 sm:p-10">
          <AccountSection user={user} setUser={setUser} handleLogout={handleLogout} loggingOut={loggingOut} />
        </section>
      </div>
    </div>
  );
}

function AccountSection({ user, setUser, handleLogout, loggingOut }: { user: any; setUser: any; handleLogout: any; loggingOut: boolean }) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleUpdate = async (field: string) => {
    setError(null);
    setSuccess(null);

    // Validation
    if (field === "password" && formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const data: any = {};
      if (field === "name") data.name = formData.name;
      if (field === "email") {
        data.email = formData.email;
        data.currentPassword = formData.currentPassword;
      }
      if (field === "password") {
        data.currentPassword = formData.currentPassword;
        data.newPassword = formData.newPassword;
      }

      const res = await updateProfile(data);
      if (res.success) {
        setUser(res.user);
        setSuccess(`${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully.`);
        setEditingField(null);
        setFormData({ ...formData, currentPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update account.");
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field: string, label: string, value: string, type: string = "text") => {
    const isEditing = editingField === field;
    const isGoogleAccount = !!user.google_id;
    const isRestricted = isGoogleAccount && (field === "email" || field === "password");

    return (
      <div className="border-b border-white/5 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">{label}</div>
            {!isEditing && (
              <div className="flex flex-col gap-1.5">
                <div className="text-xs text-muted-foreground">
                  {field === "password" ? (isGoogleAccount ? "Protected by Google" : "••••••••") : value}
                </div>
                {isRestricted && (
                  <div className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-white/5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <Globe className="h-3 w-3" /> Managed by Google
                  </div>
                )}
              </div>
            )}
          </div>
          
          {!isEditing ? (
            !isRestricted && (
              <button
                onClick={() => {
                  setEditingField(field);
                  setError(null);
                  setSuccess(null);
                }}
                className="text-xs font-bold uppercase tracking-wider text-primary hover:underline"
              >
                Edit
              </button>
            )
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setEditingField(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/5 transition-smooth"
              >
                <X className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleUpdate(field)}
                disabled={loading}
                className="rounded-lg bg-primary/20 p-1.5 text-primary hover:bg-primary/30 transition-smooth disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              </button>
            </div>
          )}
        </div>

        {isEditing && (
          <div className="mt-4 space-y-3 animate-fade-in">
            {field === "name" && (
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-background/50 px-4 py-2 text-sm focus:border-primary/50 focus:outline-none"
                placeholder="Enter new name"
                autoFocus
              />
            )}

            {field === "email" && !isGoogleAccount && (
              <>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-background/50 px-4 py-2 text-sm focus:border-primary/50 focus:outline-none"
                  placeholder="Enter new email"
                />
                <input
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-background/50 px-4 py-2 text-sm focus:border-primary/50 focus:outline-none"
                  placeholder="Enter current password to verify"
                />
              </>
            )}

            {field === "password" && !isGoogleAccount && (
              <>
                <input
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-background/50 px-4 py-2 text-sm focus:border-primary/50 focus:outline-none"
                  placeholder="Current password"
                />
                <input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-background/50 px-4 py-2 text-sm focus:border-primary/50 focus:outline-none"
                  placeholder="New password"
                />
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-background/50 px-4 py-2 text-sm focus:border-primary/50 focus:outline-none"
                  placeholder="Confirm new password"
                />
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold">Account Security</h2>
        <ShieldCheck className="h-5 w-5 text-success" />
      </div>

      {error && (
        <div className="rounded-xl bg-destructive/10 px-4 py-3 text-xs font-semibold text-destructive animate-fade-in">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl bg-success/10 px-4 py-3 text-xs font-semibold text-success animate-fade-in">
          {success}
        </div>
      )}

      <div className="space-y-6">
        {renderField("name", "Display Name", user.name)}
        {renderField("email", "Email Address", user.email)}
        {renderField("password", "Account Password", "")}

        <div className="border-b border-white/5 pb-6">
          <div className="text-sm font-semibold">Account Type</div>
          <div className="mt-1 flex flex-col gap-1.5">
            <div className="text-xs text-muted-foreground">{user.google_id ? "Google OAuth" : "Local Password"}</div>
            <div className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-white/5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {user.google_id ? "Managed by Google" : "Managed by ReccoFlix"}
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="mt-4 inline-flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-6 py-3 text-sm font-bold text-destructive hover:bg-destructive/20 transition-smooth disabled:opacity-50"
      >
        {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
        Sign out of ReccoFlix
      </button>
    </div>
  );
}

function Toggle({ label, defaultOn = false }: { label: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button onClick={() => setOn((o) => !o)} className="flex w-full items-center justify-between border-b border-white/5 pb-4 text-left">
      <span className="text-sm font-semibold">{label}</span>
      <span className={cn("relative h-6 w-11 rounded-full transition-smooth", on ? "bg-gradient-primary shadow-glow" : "bg-white/10")}>
        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-smooth", on ? "left-[1.4rem]" : "left-0.5")} />
      </span>
    </button>
  );
}
