import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { removeFromLibrary, addToLibrary } from "@/lib/api";
import { Library as LibraryIcon, Trash2, ExternalLink, Loader2, ChevronDown, Play, CheckCircle, Clock, Bookmark, XCircle, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLibrary } from "@/lib/library-context";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/library")({
  head: () => ({ meta: [{ title: "My Library — ReccoFlix" }] }),
  component: LibraryPage,
});

const tabs = [
  { key: "all", label: "All", color: "bg-gradient-primary" },
  { key: "watching", label: "Watching", color: "bg-success" },
  { key: "completed", label: "Completed", color: "bg-cyan" },
  { key: "planned", label: "Planned", color: "bg-primary" },
  { key: "favorites", label: "Favorites", color: "bg-pink" },
  { key: "on-hold", label: "On Hold", color: "bg-secondary" },
  { key: "dropped", label: "Dropped", color: "bg-muted" },
];

const STATUS_OPTIONS = [
  { id: "watching", label: "Watching", icon: Play, color: "text-success", bg: "bg-success/10" },
  { id: "completed", label: "Completed", icon: CheckCircle, color: "text-cyan", bg: "bg-cyan/10" },
  { id: "on-hold", label: "On Hold", icon: Clock, color: "text-purple", bg: "bg-purple/10" },
  { id: "planned", label: "Plan to Watch", icon: Bookmark, color: "text-primary", bg: "bg-primary/10" },
  { id: "dropped", label: "Dropped", icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
];

function LibraryPage() {
  const { user, isAuthenticated } = useAuth();
  const { library, isLoading, refreshLibrary } = useLibrary();
  const [tab, setTab] = useState("all");
  const [updating, setUpdating] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const router = useRouter();

  const readTabFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    if (status && tabs.some((t) => t.key === status)) {
      setTab(status);
    } else {
      setTab("all");
    }
  };

  useEffect(() => {
    readTabFromUrl();
  }, []);

  useEffect(() => {
    const unsub = router.subscribe("onResolved", () => {
      readTabFromUrl();
    });
    return unsub;
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4 animate-fade-in">
        <div className="relative mb-8">
          <div className="absolute -inset-4 rounded-full bg-gradient-primary opacity-20 blur-2xl" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-primary shadow-glow animate-float">
            <LibraryIcon className="h-12 w-12 text-primary-foreground" />
          </div>
        </div>
        
        <h1 className="text-3xl font-black sm:text-5xl tracking-tight">
          Your <span className="text-gradient-primary">Universal Library</span>
        </h1>
        <p className="mt-4 max-w-md text-sm text-muted-foreground sm:text-base leading-relaxed">
          Sign in to track your progress, save your favorites, and unlock personalized AI recommendations tailored to your taste.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Link
            to="/login"
            className="w-full sm:w-auto rounded-full bg-gradient-primary px-10 py-4 text-sm font-black text-primary-foreground shadow-glow hover:scale-105 transition-all"
          >
            Sign In Now
          </Link>
          <Link
            to="/browse"
            className="w-full sm:w-auto rounded-full glass px-10 py-4 text-sm font-bold text-foreground hover:bg-white/10 transition-all"
          >
            Explore Anime
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-8 text-left max-w-lg border-t border-white/5 pt-12">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-2">Track Progress</h3>
            <p className="text-xs text-muted-foreground">Keep tabs on what you're watching, completed, or plan to watch.</p>
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-secondary mb-2">AI Insights</h3>
            <p className="text-xs text-muted-foreground">Your library fuels our AI to find your next perfect obsession.</p>
          </div>
        </div>
      </div>
    );
  }

  const filtered = tab === "all" ? library : tab === "favorites" ? library.filter((item) => item.is_favorite) : library.filter((item) => item.status === tab);

  const totalCount = library.filter((i) => i.status === "watching").length
    + library.filter((i) => i.status === "completed").length
    + library.filter((i) => i.status === "planned").length
    + library.filter((i) => i.is_favorite).length;

  const handleUpdateStatus = async (item: any, newStatus: string) => {
    setUpdating(item.anime_id);
    setOpenMenu(null);
    try {
      await addToLibrary(item.anime_id, item.anime_title, item.poster_image, newStatus);
      await refreshLibrary();
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdating(null);
    }
  };

  const handleRemove = async (anime_id: string) => {
    setUpdating(anime_id);
    setOpenMenu(null);
    try {
      await removeFromLibrary(anime_id);
      await refreshLibrary();
    } catch (err) {
      console.error("Failed to remove:", err);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
          <LibraryIcon className="h-7 w-7 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold sm:text-4xl">
            My <span className="text-gradient-primary">Library</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalCount} anime tracked · manage your collection
          </p>
        </div>
      </header>

      {/* Filter tabs */}
      <div className="flex flex-nowrap overflow-x-auto no-scrollbar gap-2 rounded-2xl glass p-2 -mx-2 px-2 sm:flex-wrap sm:overflow-visible sm:mx-0 sm:px-2">
        {tabs.map((t) => {
          const count = t.key === "all" ? totalCount : t.key === "favorites" ? library.filter((item) => item.is_favorite).length : library.filter((item) => item.status === t.key).length;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-smooth",
                tab === t.key ? `${t.color} text-background shadow-glow` : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
              )}
            >
              {t.label}
              <span className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold",
                tab === t.key ? "bg-background/30" : "bg-white/10",
              )}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Library grid */}
      {filtered.length === 0 ? (
        <div className="glass rounded-3xl p-16 text-center border border-dashed border-white/10">
          <LibraryIcon className="mx-auto h-16 w-16 text-muted-foreground/20 mb-4" />
          <p className="text-lg font-bold text-muted-foreground">
            {tab === "all" ? "Your library is empty" : `No ${tab} anime found`}
          </p>
          <p className="mt-1 text-sm text-muted-foreground/60">
            Start building your collection by browsing the catalog.
          </p>
          <Link
            to="/browse"
          >
            <button className="mt-8 inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-gradient-primary px-8 py-4 text-sm font-black text-primary-foreground shadow-glow transition-smooth hover:scale-[1.03]">
              <Play className="h-4 w-4 fill-current" /> Browse Anime
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 animate-fade-up">
          {filtered.map((item) => {
            const currentOpt = STATUS_OPTIONS.find(o => o.id === item.status);
            return (
              <div key={item.anime_id} className="group relative rounded-2xl border border-white/5 bg-card transition-smooth hover:shadow-elevated">
                {/* Poster */}
                <Link to="/anime/$id" params={{ id: item.anime_id }}>
                  <div className="aspect-[2/3] overflow-hidden rounded-t-2xl">
                    <img
                      src={item.poster_image || "https://placehold.co/300x450?text=No+Image"}
                      alt={item.anime_title || "Anime"}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                </Link>

                {/* Status Dropdown Trigger */}
                <div className="absolute right-2 top-2 z-10">
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenu(openMenu === item.anime_id ? null : item.anime_id)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold backdrop-blur-md border border-white/10 transition-smooth",
                        item.status === "watching" && "bg-success text-success-foreground shadow-glow-success",
                        item.status === "completed" && "bg-cyan text-cyan-foreground shadow-glow-cyan",
                        item.status === "planned" && "bg-primary text-primary-foreground shadow-glow",
                        item.status === "on-hold" && "bg-purple text-purple-foreground shadow-glow-purple",
                        item.status === "dropped" && "bg-muted text-muted-foreground",
                      )}
                    >
                      {updating === item.anime_id ? <Loader2 className="h-3 w-3 animate-spin" /> : currentOpt?.label || "Status"}
                      <ChevronDown className={cn("h-3 w-3 transition-transform", openMenu === item.anime_id && "rotate-180")} />
                    </button>

                    {openMenu === item.anime_id && (
                      <div className="absolute right-0 top-full z-[100] mt-1.5 w-44 overflow-visible rounded-xl border border-white/10 bg-card/95 p-1 shadow-elevated backdrop-blur-xl animate-fade-in">
                        {STATUS_OPTIONS.map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => handleUpdateStatus(item, opt.id)}
                            className={cn(
                              "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[11px] font-semibold transition-smooth hover:bg-white/5",
                              item.status === opt.id ? opt.color + " " + opt.bg : "text-muted-foreground"
                            )}
                          >
                            <opt.icon className="h-3.5 w-3.5" />
                            {opt.label}
                          </button>
                        ))}
                        <div className="my-1 h-px bg-white/5" />
                        <button
                          onClick={() => handleRemove(item.anime_id)}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[11px] font-semibold text-destructive transition-smooth hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Title and External Link */}
                <div className="p-3">
                  <h3 className="line-clamp-1 text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                    {item.anime_title || "Unknown Anime"}
                  </h3>
                  <div className="mt-2 flex items-center justify-between">
                     <Link 
                        to="/anime/$id" 
                        params={{ id: item.anime_id }}
                        className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                      >
                        Details <ExternalLink className="h-3 w-3" />
                     </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
