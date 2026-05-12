import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Home, Compass, Library, PlayCircle, CheckCircle2, Pause, Bookmark,
  Heart, Sparkles, Settings, Menu, X, Search, Bell, User, Film,
  TrendingUp, Tv, Star, Globe, Zap,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useLibrary } from "@/lib/library-context";

// Navigation items shown when the user is logged in
const loggedInNav = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/browse", label: "Browse", icon: Compass },
  { divider: true, label: "MY COLLECTION" },
  { to: "/library", label: "My Library", icon: Library },
  { to: "/library?status=watching", label: "Currently Watching", icon: PlayCircle, match: "/library" },
  { to: "/library?status=completed", label: "Completed", icon: CheckCircle2, match: "/library" },
  { to: "/library?status=on-hold", label: "On Hold", icon: Pause, match: "/library" },
  { to: "/library?status=planned", label: "Planned", icon: Bookmark, match: "/library" },
  { to: "/favorites", label: "Favorites", icon: Heart },
  { divider: true, label: "DISCOVER" },
  { to: "/browse?category=trending", label: "Trending", icon: TrendingUp, match: "/browse" },
  { to: "/recommendations", label: "For You", icon: Sparkles },
  { to: "/mood", label: "Mood Picker", icon: Zap },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

// Navigation items shown when the user is NOT logged in (discovery mode)
const guestNav = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/browse", label: "Browse", icon: Compass },
  { divider: true, label: "DISCOVER" },
  { to: "/browse?category=trending", label: "Trending", icon: TrendingUp, match: "/browse" },
  { to: "/recommendations", label: "Recommendations", icon: Sparkles },
  { to: "/mood", label: "Mood Picker", icon: Zap },
] as const;

type NavItem = { to: string; label: string; icon: any; exact?: boolean; match?: string; divider?: never }
  | { divider: true; label: string; to?: never; icon?: never; exact?: never; match?: never };

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([
    { id: 'welcome', title: 'Welcome to ReccoFlix! 🚀', message: 'Start by adding anime to your library for AI picks.', type: 'welcome' }
  ]);
  const [unreadCount, setUnreadCount] = useState(1);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  const nav = (isAuthenticated ? loggedInNav : guestNav) as readonly NavItem[];

  const isActive = (item: NavItem) => {
    if (item.divider) return false;
    const match = item.match ? item.match : item.to.split("?")[0];
    if (item.exact) return pathname === "/";
    return pathname.startsWith(match);
  };

  useEffect(() => {
    if (isAuthenticated) {
      import("@/lib/api").then(({ fetchOngoing }) => {
        fetchOngoing().then(animes => {
          if (animes.length > 0) {
            const updates = animes.slice(0, 2).map(a => ({
              id: a.id,
              title: a.title,
              message: "New episode is trending now!",
              icon: a.poster,
              type: 'update'
            }));
            setNotifications(prev => [...updates, ...prev]);
            setUnreadCount(prev => prev + updates.length);
          }
        });
      });
    }
  }, [isAuthenticated]);

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate({ to: `/search`, search: { q: searchQuery } });
    }
  };

  return (
    <div className="relative flex min-h-screen w-full">
      {/* Ambient background blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute right-0 top-1/3 h-[28rem] w-[28rem] rounded-full bg-accent/15 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 h-[24rem] w-[24rem] rounded-full bg-cyan/10 blur-[120px]" />
      </div>

      {/* Sidebar - desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 lg:flex">
        <SidebarInner nav={nav} pathname={pathname} isActive={isActive} user={user} />
      </aside>

      {/* Sidebar - mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 animate-fade-up">
            <SidebarInner nav={nav} pathname={pathname} isActive={isActive} user={user} onNavigate={() => setMobileOpen(false)} />
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 rounded-full p-2 text-muted-foreground hover:text-foreground"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top navbar */}
        <header className="sticky top-0 z-40 border-b border-white/5 glass-strong">
          <div className="flex items-center gap-1.5 px-2 sm:gap-3 sm:px-6 py-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-foreground hover:bg-white/5 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link to="/" className="flex items-center gap-2 lg:hidden shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-primary shadow-glow shrink-0">
                <Film className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-sm sm:text-base font-extrabold tracking-tight text-gradient-primary hidden xs:block">RECCOFLIX</span>
            </Link>

            <div className="ml-auto flex items-center justify-end gap-1 sm:gap-3">
              {pathname !== "/search" && (
                <form onSubmit={handleSearch} className="relative hidden max-w-md flex-1 sm:block animate-fade-in">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search anime by title, genre, studio..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-full border border-white/10 bg-background/40 py-2 pl-10 pr-4 text-sm text-foreground transition-smooth focus:border-primary/60 focus:bg-background/60 focus:outline-none focus:shadow-glow"
                  />
                </form>
              )}
              
              <Link to="/search" className="rounded-full p-2 text-muted-foreground hover:bg-white/5 hover:text-foreground sm:hidden" aria-label="Search">
                <Search className="h-5 w-5" />
              </Link>

              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative rounded-full p-2 text-muted-foreground transition-smooth hover:bg-white/5 hover:text-foreground" 
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-pink shadow-glow-pink" />
                  )}
                </button>

                {showNotifications && (
                  <div className="fixed inset-x-4 top-20 z-50 mx-auto max-w-sm animate-fade-up rounded-2xl border border-white/10 bg-card p-4 shadow-elevated glass-strong sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-3 sm:w-80 sm:mx-0">
                    <div className="mb-3 flex items-center justify-between border-b border-white/5 pb-2">
                      <h3 className="text-sm font-bold">Notifications</h3>
                      <button onClick={clearNotifications} className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-smooth">Clear all</button>
                    </div>
                    <div className="max-h-[300px] space-y-3 overflow-y-auto pr-1">
                      {notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <button
                            key={notif.id}
                            onClick={() => {
                              setShowNotifications(false);
                              if (notif.type === 'update') {
                                navigate({ to: `/anime/$id`, params: { id: notif.id } });
                              } else {
                                navigate({ to: '/browse' });
                              }
                            }}
                            className="flex w-full text-left gap-3 rounded-xl bg-white/5 p-2.5 text-xs transition-smooth hover:bg-white/10 hover:border-primary/30 border border-transparent"
                          >
                            {notif.icon ? (
                              <img src={notif.icon} className="h-10 w-10 shrink-0 rounded-lg object-cover shadow-sm" alt="" />
                            ) : (
                              <div className="h-10 w-10 shrink-0 rounded-lg bg-gradient-primary shadow-glow flex items-center justify-center">
                                <Sparkles className="h-5 w-5 text-primary-foreground" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-foreground line-clamp-1">{notif.title}</p>
                              <p className="mt-0.5 text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">{notif.message}</p>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="py-8 text-center">
                          <Bell className="mx-auto h-8 w-8 text-muted-foreground/20" />
                          <p className="mt-2 text-xs text-muted-foreground">No new notifications</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {user ? (
                <Link
                  to="/profile"
                  className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-purple shadow-glow-purple transition-smooth hover:scale-105 sm:h-9 sm:w-9"
                  title={`Logged in as ${user.name || user.email}`}
                >
                  {user.avatar_url || localStorage.getItem(`rf_avatar_${user.id}`) ? (
                    <img src={user.avatar_url || localStorage.getItem(`rf_avatar_${user.id}`) || ""} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-3.5 w-3.5 text-white sm:h-4 sm:w-4" />
                  )}
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="rounded-full bg-gradient-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow-glow transition-smooth hover:scale-105 sm:px-4 sm:py-1.5 sm:text-sm"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 pb-12 pt-6 sm:px-6 lg:px-8">{children}</main>

        <footer className="border-t border-white/5 glass">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-6 text-xs text-muted-foreground sm:flex-row">
            <div className="flex items-center gap-4">
              <Link to="/about" className="hover:text-foreground transition-smooth">About</Link>
              <Link to="/privacy" className="hover:text-foreground transition-smooth">Privacy</Link>
              <Link to="/terms" className="hover:text-foreground transition-smooth">Terms</Link>
              <a href="https://github.com/ShreyasUday/ReccoFlix" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-smooth">GitHub</a>
            </div>
            <p>© 2026 ReccoFlix · Crafted for anime lovers</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

function SidebarInner({
  nav,
  pathname,
  isActive,
  user,
  onNavigate,
}: {
  nav: readonly NavItem[];
  pathname: string;
  isActive: (item: NavItem) => boolean;
  user: any;
  onNavigate?: () => void;
}) {
  const { library } = useLibrary();

  const getCount = (label: string, to: string) => {
    if (!user) return null;
    if (label === "My Library") return library.length;
    if (label === "Favorites") return library.filter(a => a.is_favorite).length;
    
    const url = new URL(to, "http://localhost");
    const status = url.searchParams.get("status");
    if (status) {
      return library.filter(a => a.status === status).length;
    }
    return null;
  };

  return (
    <div className="relative flex h-full w-full flex-col border-r border-white/5 glass-strong px-4 py-5">
      <Link to="/" onClick={onNavigate} className="mb-6 flex items-center gap-2.5 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
          <Film className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <div className="text-lg font-extrabold tracking-tight text-gradient-primary">RECCOFLIX</div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Anime · 2026</div>
        </div>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {nav.map((item) => {
          if (item.divider) {
            return (
              <div key={item.label} className="mt-5 mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                {item.label}
              </div>
            );
          }
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "group relative mx-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-smooth",
                active
                  ? "bg-gradient-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
              )}
            >
              <Icon className={cn("h-4.5 w-4.5 shrink-0", active ? "text-primary-foreground" : "")} />
              <span className="truncate">{item.label}</span>
              {active ? (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-foreground" />
              ) : (
                <span className="ml-auto text-[10px] font-bold opacity-0 transition-opacity group-hover:opacity-100">
                  {getCount(item.label, item.to)}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom card — CTA for guests, AI picks for logged-in users */}
      {user ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-gradient-purple/30 p-4 shadow-glow-purple">
          <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary-glow" />
            AI Picks
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            12 new anime tailored to your taste are waiting in your feed.
          </p>
          <Link
            to="/recommendations"
            onClick={onNavigate}
            className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-gradient-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-glow"
          >
            Explore
          </Link>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-white/10 bg-gradient-primary/20 p-4 shadow-glow">
          <div className="mb-1 text-xs font-bold uppercase tracking-wider text-foreground">
            Join ReccoFlix
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Track your anime, get AI recommendations, and build your library.
          </p>
          <Link
            to="/signup"
            onClick={onNavigate}
            className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-gradient-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-glow"
          >
            Create Account
          </Link>
        </div>
      )}
    </div>
  );
}
