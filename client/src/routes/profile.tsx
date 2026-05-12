import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { fetchProfile } from "@/lib/api";
import {
  Settings, Library, LogOut, Mail, User as UserIcon,
  Clock, CheckCircle2, Heart, Bookmark, Loader2, Film, ExternalLink,
  Camera, X, ImagePlus, Palette, Star, Upload,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — ReccoFlix" }] }),
  component: ProfilePage,
});


const PRESET_COVERS = [
  { id: "sunset", url: "", css: "linear-gradient(135deg, #f97316 0%, #db2777 50%, #7c3aed 100%)", label: "Sunset" },
  { id: "ocean", url: "", css: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #6366f1 100%)", label: "Ocean" },
  { id: "neon", url: "", css: "linear-gradient(135deg, #f43f5e 0%, #a855f7 50%, #06b6d4 100%)", label: "Neon" },
  { id: "sakura", url: "", css: "linear-gradient(135deg, #fda4af 0%, #f9a8d4 50%, #e879f9 100%)", label: "Sakura" },
  { id: "midnight", url: "", css: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)", label: "Midnight" },
  { id: "forest", url: "", css: "linear-gradient(135deg, #10b981 0%, #059669 50%, #065f46 100%)", label: "Forest" },
  { id: "ember", url: "", css: "linear-gradient(135deg, #fbbf24 0%, #f97316 50%, #ef4444 100%)", label: "Ember" },
  { id: "aurora", url: "", css: "linear-gradient(135deg, #a78bfa 0%, #22d3ee 50%, #34d399 100%)", label: "Aurora" },
];


const DEFAULT_COVER_CSS = "linear-gradient(135deg, hsl(25 95% 53% / 0.4), hsl(330 80% 48% / 0.3), hsl(270 70% 55% / 0.4))";

function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [libraryItems, setLibraryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverData, setCoverData] = useState<{ type: "css" | "url"; value: string }>({ type: "css", value: DEFAULT_COVER_CSS });
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showCoverModal, setShowCoverModal] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile()
      .then((data) => {
        setUser(data.user);
        setLibraryItems(data.library || []);
        setLoading(false);
        const sa = localStorage.getItem(`rf_avatar_${data.user.id}`);
        const sc = localStorage.getItem(`rf_cover_${data.user.id}`);
        if (sa) setAvatarUrl(sa);
        if (sc) {
          try { setCoverData(JSON.parse(sc)); } catch { /* ignore */ }
        }
      })
      .catch(() => { setLoading(false); navigate({ to: "/login" }); });
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    navigate({ to: "/" });
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const d = reader.result as string;
      setAvatarUrl(d);
      if (user) localStorage.setItem(`rf_avatar_${user.id}`, d);
      setShowAvatarModal(false);
    };
    reader.readAsDataURL(file);
  };

  const selectPresetAvatar = (url: string) => {
    setAvatarUrl(url);
    if (user) localStorage.setItem(`rf_avatar_${user.id}`, url);
    setShowAvatarModal(false);
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const d = { type: "url" as const, value: reader.result as string };
      setCoverData(d);
      if (user) localStorage.setItem(`rf_cover_${user.id}`, JSON.stringify(d));
      setShowCoverModal(false);
    };
    reader.readAsDataURL(file);
  };

  const selectPresetCover = (cover: typeof PRESET_COVERS[0]) => {
    const d = cover.url
      ? { type: "url" as const, value: cover.url }
      : { type: "css" as const, value: cover.css! };
    setCoverData(d);
    if (user) localStorage.setItem(`rf_cover_${user.id}`, JSON.stringify(d));
    setShowCoverModal(false);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return null;

  const watchingCount = libraryItems.filter((i) => i.status === "watching").length;
  const completedCount = libraryItems.filter((i) => i.status === "completed").length;
  const plannedCount = libraryItems.filter((i) => i.status === "planned").length;
  const favoritesCount = libraryItems.filter((i) => i.is_favorite).length;

  const stats = [
    { label: "Watching", value: watchingCount, icon: Clock, color: "text-success", bg: "bg-success/10", to: "/library?status=watching" },
    { label: "Completed", value: completedCount, icon: CheckCircle2, color: "text-cyan", bg: "bg-cyan/10", to: "/library?status=completed" },
    { label: "Planned", value: plannedCount, icon: Bookmark, color: "text-primary", bg: "bg-primary/10", to: "/library?status=planned" },
    { label: "Favorites", value: favoritesCount, icon: Heart, color: "text-pink", bg: "bg-pink/10", to: "/favorites" },
    { label: "Total", value: watchingCount + completedCount + plannedCount + favoritesCount, icon: Star, color: "text-accent", bg: "bg-accent/10", to: "/library" },
  ];

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "2026";

  const coverStyle = coverData.type === "url"
    ? { backgroundImage: `url(${coverData.value})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: coverData.value };

  return (
    <div className="space-y-8">
      {/* Banner + Avatar + Info */}
      <section className="relative -mx-4 overflow-hidden rounded-3xl sm:-mx-2">
        <div className="relative h-44 sm:h-56">
          <div className="h-full w-full" style={coverStyle} />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          <button
            onClick={() => setShowCoverModal(true)}
            className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-full glass-strong px-3 py-1.5 text-xs font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-smooth"
          >
            <Palette className="h-3.5 w-3.5" /> Change Cover
          </button>
        </div>

        <div className="relative px-6 pb-6 text-left sm:text-left">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-end sm:gap-6">
            <div className="relative -mt-16 shrink-0">
              <div className="absolute -inset-2 rounded-full bg-gradient-primary opacity-40 blur-xl" />
              <div className="relative group">
                <div
                  className="relative flex h-28 w-28 cursor-pointer items-center justify-center overflow-hidden rounded-full border-4 border-background bg-gradient-purple transition-smooth hover:scale-105"
                  onClick={() => setShowAvatarModal(true)}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <UserIcon className="h-12 w-12 text-white" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 opacity-0 transition-smooth group-hover:bg-black/50 group-hover:opacity-100 sm:flex">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                </div>
                {/* Mobile-only persistent indicator - now outside overflow-hidden */}
                <div 
                  className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-lg sm:hidden cursor-pointer"
                  onClick={() => setShowAvatarModal(true)}
                >
                  <Camera className="h-4 w-4" />
                </div>
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-4 md:space-y-6">
              <h1 className="truncate text-2xl font-extrabold leading-tight sm:text-3xl md:text-4xl">{user.name || "Anime Fan"}</h1>
              
              <div className="flex flex-col gap-2 text-sm text-muted-foreground md:flex-row md:items-center md:gap-x-6">
                <span className="inline-flex items-center gap-2 whitespace-nowrap"><Mail className="h-4 w-4 shrink-0 text-primary/70" />{user.email}</span>
                <span className="inline-flex items-center gap-2 whitespace-nowrap"><Clock className="h-4 w-4 shrink-0 text-primary/70" />Member since {memberSince}</span>
              </div>

              <div className="flex flex-wrap justify-start gap-2 pt-1">
                {user.google_id && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-foreground">
                    <Star className="h-3 w-3 text-primary fill-primary" /> Google Linked
                  </span>
                )}
                <span className="rounded-full glass px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider">{libraryItems.length} anime tracked</span>
                {favoritesCount > 0 && <span className="rounded-full glass px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider">{favoritesCount} ❤️ favorites</span>}
              </div>
            </div>

            <div className="flex w-full shrink-0 flex-col gap-2 md:w-auto md:flex-row md:items-center">
              <Link to="/library" className="inline-flex items-center justify-center gap-2 rounded-full glass-strong px-6 py-3 text-sm font-bold hover:bg-white/10 transition-smooth">
                <Library className="h-4 w-4" /> My Library
              </Link>
              <button onClick={handleLogout} disabled={loggingOut} className="inline-flex items-center justify-center gap-2 rounded-full glass-strong px-6 py-3 text-sm font-bold text-pink hover:bg-pink/10 transition-smooth disabled:opacity-50">
                {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />} Log out
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="glass rounded-2xl p-5 transition-smooth hover:shadow-glow hover:-translate-y-1">
            <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${s.bg}`}><s.icon className={`h-4.5 w-4.5 ${s.color}`} /></div>
            <div className="mt-3 text-2xl font-extrabold">{s.value}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
          </Link>
        ))}
      </section>

      {/* Recent library entries */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Recent in Library</h2>
          <Link to="/library" className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">View all <ExternalLink className="h-3.5 w-3.5" /></Link>
        </div>
        {libraryItems.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <Film className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 text-lg font-semibold text-muted-foreground">No anime in your library yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Start browsing and add some anime!</p>
            <Link to="/browse" className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-glow">Browse Anime</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
            {libraryItems.slice(0, 12).map((item) => (
              <Link key={item.anime_id} to="/anime/$id" params={{ id: item.anime_id }} className="group">
                <div className="aspect-[2/3] overflow-hidden rounded-2xl border border-white/5 bg-card">
                  <img src={item.poster_image || "https://placehold.co/300x450?text=No+Image"} alt={item.anime_title || "Anime"} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                </div>
                <div className="mt-2 px-1">
                  <h3 className="line-clamp-1 text-sm font-semibold text-foreground transition-colors group-hover:text-primary">{item.anime_title || "Unknown"}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground capitalize">{item.status || "Added"}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ═══ Avatar Modal ═══ */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setShowAvatarModal(false)} />
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-card p-8 shadow-elevated animate-fade-up">
            <button onClick={() => setShowAvatarModal(false)} className="absolute right-6 top-6 rounded-full p-2 text-muted-foreground hover:bg-white/5 hover:text-foreground transition-smooth">
              <X className="h-5 w-5" />
            </button>
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-glow">
              <Camera className="h-8 w-8" />
            </div>
            <h3 className="mb-2 text-2xl font-black">Change Avatar</h3>
            <p className="text-sm text-muted-foreground mb-6">Upload a profile picture from your device.</p>

            <button onClick={() => avatarInputRef.current?.click()} className="flex w-full items-center justify-center gap-3 rounded-2xl border border-dashed border-white/20 bg-white/5 py-6 text-sm font-bold text-muted-foreground hover:border-primary hover:text-primary transition-smooth">
              <Upload className="h-5 w-5" /> Upload from device
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
        </div>
      )}

      {/* ═══ Cover Modal ═══ */}
      {showCoverModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setShowCoverModal(false)} />
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-card p-8 shadow-elevated animate-fade-up">
            <button onClick={() => setShowCoverModal(false)} className="absolute right-6 top-6 rounded-full p-2 text-muted-foreground hover:bg-white/5 hover:text-foreground transition-smooth">
              <X className="h-5 w-5" />
            </button>
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent shadow-glow">
              <Palette className="h-8 w-8" />
            </div>
            <h3 className="mb-2 text-2xl font-black">Change Cover</h3>
            <p className="text-sm text-muted-foreground mb-6">Upload your own image or pick a gradient.</p>

            <button onClick={() => coverInputRef.current?.click()} className="mb-6 flex w-full items-center justify-center gap-3 rounded-2xl border border-dashed border-white/20 bg-white/5 py-6 text-sm font-bold text-muted-foreground hover:border-accent hover:text-accent transition-smooth">
              <Upload className="h-5 w-5" /> Upload from device
            </button>
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />

            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Gradients</p>
            <div className="grid grid-cols-4 gap-3">
              {PRESET_COVERS.map((c) => (
                <button key={c.id} onClick={() => selectPresetCover(c)} className="relative h-16 overflow-hidden rounded-2xl border-2 border-transparent hover:border-accent transition-smooth" style={{ background: c.css }} title={c.label}>
                  {coverData.type === "css" && coverData.value === c.css && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl"><CheckCircle2 className="h-5 w-5 text-white" /></div>
                  )}
                </button>
              ))}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
