import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { fetchAnimeDetails, addToLibrary, removeFromLibrary, toggleFavorite, fetchShareLine } from "@/lib/api";
import { AnimeRow } from "@/components/anime-row";
import { Star, Play, Plus, Heart, Share2, Tv, Calendar, CheckCircle2, Loader2, XCircle, ChevronDown, Bookmark, Clock, CheckCircle, Copy, Check, X, Twitter, BookOpen, Compass } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useLibrary } from "@/lib/library-context";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/anime/$id")({
  loader: async ({ params }) => {
    try {
      const data = await fetchAnimeDetails(params.id);
      return data;
    } catch (err) {
      throw notFound();
    }
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.desc.title} — ReccoFlix` },
          { name: "description", content: loaderData.desc.synopsis },
        ]
      : [],
  }),
  component: AnimePage,
});

const STATUS_OPTIONS = [
  { id: "watching", label: "Watching", icon: Play, color: "text-success", bg: "bg-success/10" },
  { id: "completed", label: "Completed", icon: CheckCircle, color: "text-cyan", bg: "bg-cyan/10" },
  { id: "on-hold", label: "On Hold", icon: Clock, color: "text-purple", bg: "bg-purple/10" },
  { id: "planned", label: "Plan to Watch", icon: Bookmark, color: "text-primary", bg: "bg-primary/10" },
  { id: "dropped", label: "Dropped", icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
];

function AnimePage() {
  const { desc: anime, related } = Route.useLoaderData();
  const { getAnimeStatus, isFavorite, refreshLibrary } = useLibrary();
  const { isAuthenticated } = useAuth();
  
  const globalStatus = getAnimeStatus(anime.id);
  const globalIsFavorite = isFavorite(anime.id);

  const [status, setStatus] = useState<string | null>(globalStatus);
  const [isFav, setIsFav] = useState(globalIsFavorite);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  
  // Share Modal State
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLine, setShareLine] = useState("");
  const [isGeneratingLine, setIsGeneratingLine] = useState(false);
  const [copied, setCopied] = useState(false);

  const [tab, setTab] = useState<"overview" | "episodes">("overview");
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [totalEpisodes, setTotalEpisodes] = useState(0);
  const [episodeOffset, setEpisodeOffset] = useState(0);
  const [episodesPerPage] = useState(50);
  const [selectedRange, setSelectedRange] = useState(0); // For the 50+ dropdown

  const [isTabLoading, setIsTabLoading] = useState(false);

  useEffect(() => {
    setStatus(globalStatus);
    setIsFav(globalIsFavorite);
  }, [globalStatus, globalIsFavorite]);

  useEffect(() => {
    if (tab === "episodes") {
      setIsTabLoading(true);
      console.log(`[FRONTEND] Fetching episodes for ID: ${anime.id}, Offset: ${episodeOffset}`);
      import("@/lib/api").then(m => m.fetchEpisodes(anime.id, episodesPerPage, episodeOffset)).then(res => {
        setEpisodes(res.data);
        setTotalEpisodes(res.total);
        setIsTabLoading(false);
      }).catch(err => {
        console.error(`[FRONTEND] Episode fetch failed:`, err);
        setIsTabLoading(false);
      });
    }
  }, [tab, anime.id, episodeOffset]);

  // Handle Range Dropdown Change
  const handleRangeChange = (start: number) => {
    setSelectedRange(start);
    setEpisodeOffset(start);
  };

  const handleUpdateLibrary = async (newStatus: string) => {
    if (!isAuthenticated) {
      setShowStatusMenu(false);
      toast.error("Sign in to build your library", {
        description: "Login to save your watching progress and get AI picks.",
        action: { label: "Login", onClick: () => window.location.href = "/login" }
      });
      return;
    }
    setLoading(true);
    setShowStatusMenu(false);
    try {
      await addToLibrary(anime.id, anime.title, anime.poster, newStatus);
      await refreshLibrary();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      toast.error("Sign in to favorite anime", {
        description: "Keep track of your absolute favorites in one place.",
        action: { label: "Login", onClick: () => window.location.href = "/login" }
      });
      return;
    }
    setLoading(true);
    try {
      // Logic is now robust on backend: it will add to library if missing
      await toggleFavorite(anime.id, anime.title, anime.poster);
      await refreshLibrary();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    setLoading(true);
    try {
      await removeFromLibrary(anime.id);
      await refreshLibrary();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenShare = async () => {
    setShowShareModal(true);
    if (!shareLine) {
      setIsGeneratingLine(true);
      try {
        const line = await fetchShareLine(anime.title, anime.synopsis);
        setShareLine(line);
      } catch (err) {
        setShareLine(`You have to check out ${anime.title} on ReccoFlix!`);
      } finally {
        setIsGeneratingLine(false);
      }
    }
  };

  const handleCopyLink = () => {
    const text = shareLine 
      ? `${shareLine}\n\n${window.location.href}` 
      : window.location.href;
    
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } else {
      // Fallback for insecure contexts (like IP addresses without HTTPS)
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleCopyQuote = () => {
    if (!shareLine) return;
    
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(shareLine).then(() => {
        setCopiedQuote(true);
        setTimeout(() => setCopiedQuote(false), 2000);
      });
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = shareLine;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedQuote(true);
        setTimeout(() => setCopiedQuote(false), 2000);
      } catch (err) {
        console.error('Fallback quote: Unable to copy', err);
      }
      document.body.removeChild(textArea);
    }
  };

  const currentStatus = STATUS_OPTIONS.find(s => s.id === status);

  return (
    <div className="space-y-10">
      {/* Cinematic banner */}
      <section className="relative -mx-4 -mt-6 sm:-mx-6 lg:-mx-8">
        <div className="relative h-[55vh] min-h-[420px] w-full">
          <img src={anime.banner || anime.poster} alt="" className="h-full w-full object-cover object-[center_25%] brightness-[0.55] saturate-[1.3] contrast-[1.1]" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/70 to-transparent" />
        </div>

        <div className="relative -mt-64 px-4 sm:px-6 lg:px-8">
          <div className="flex w-full flex-col items-center gap-6 md:flex-row md:items-end">
            <div className="relative mx-auto w-44 shrink-0 sm:w-52 md:mx-0 md:w-60">
              <div className="absolute -inset-3 rounded-3xl bg-gradient-primary opacity-40 blur-2xl" />
              <img
                src={anime.poster}
                alt={anime.title}
                className="relative aspect-[2/3] w-full rounded-2xl border border-white/10 object-cover shadow-elevated"
              />
            </div>

            <div className="flex-1 space-y-4 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs md:justify-start">
                <span className="rounded-full bg-gradient-primary px-3 py-1 font-bold text-primary-foreground shadow-glow">
                  {anime.matchPercent}% Match
                </span>
                <span className="rounded-full glass px-3 py-1 font-medium uppercase tracking-wider">{anime.type}</span>
                <span className="rounded-full glass px-3 py-1 font-medium capitalize">{anime.status}</span>
              </div>

              <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl md:text-5xl">{anime.title}</h1>

              <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground md:justify-start">
                <span className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="font-bold text-foreground">{(anime.rating / 10).toFixed(1)}</span>
                </span>
                <span className="flex items-center gap-1.5"><Tv className="h-4 w-4" /> {anime.episodes} ep</span>
                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {anime.year}</span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2 md:justify-start">
                <Link 
                  to="/archive/$id" 
                  params={{ id: anime.id }}
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-gradient-primary px-8 py-4 text-sm font-black text-primary-foreground shadow-glow transition-smooth hover:scale-[1.03]"
                >
                  <Compass className="h-4 w-4" /> Discover Story
                </Link>
                
                <div className="relative">
                  <button 
                    disabled={loading}
                    onClick={() => setShowStatusMenu(!showStatusMenu)}
                    className={cn(
                      "inline-flex w-full sm:w-auto items-center gap-3 rounded-full px-6 py-4 text-sm font-bold transition-smooth min-w-[160px] justify-between z-10",
                      status ? "glass-strong border-primary/20 text-primary" : "glass-strong hover:bg-white/10"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : currentStatus ? (
                        <currentStatus.icon className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      {currentStatus ? currentStatus.label : "Add to List"}
                    </div>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", showStatusMenu && "rotate-180")} />
                  </button>

                  {showStatusMenu && (
                    <div className="absolute left-0 top-full z-[100] mt-2 w-56 overflow-visible rounded-2xl border border-white/10 bg-card/95 p-1.5 shadow-elevated backdrop-blur-xl animate-fade-in">
                      {STATUS_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => handleUpdateLibrary(opt.id)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-smooth hover:bg-white/5",
                            status === opt.id ? opt.bg + " " + opt.color : "text-muted-foreground"
                          )}
                        >
                          <opt.icon className="h-4 w-4" />
                          {opt.label}
                        </button>
                      ))}
                      {status && (
                        <>
                          <div className="my-1 h-px bg-white/5" />
                          <button
                            onClick={handleRemove}
                            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-destructive transition-smooth hover:bg-destructive/10"
                          >
                            <XCircle className="h-4 w-4" />
                            Remove from Library
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleToggleFavorite}
                  disabled={loading}
                  className={cn(
                    "inline-flex h-14 w-14 items-center justify-center rounded-full transition-smooth",
                    isFav ? "bg-pink text-white shadow-glow-pink" : "glass-strong hover:bg-white/10"
                  )} 
                  aria-label="Favorite"
                >
                  <Heart className={cn("h-5 w-5", isFav && "fill-current")} />
                </button>

                <button 
                  onClick={handleOpenShare}
                  className="inline-flex h-14 w-14 items-center justify-center rounded-full glass-strong transition-smooth hover:bg-cyan/20" 
                  aria-label="Share"
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setShowShareModal(false)} />
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-card p-8 shadow-elevated animate-fade-up">
            <button 
              onClick={() => setShowShareModal(false)}
              className="absolute right-6 top-6 rounded-full p-2 text-muted-foreground hover:bg-white/5 hover:text-foreground transition-smooth"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan/10 text-cyan shadow-glow-cyan">
              <Share2 className="h-8 w-8" />
            </div>

            <h3 className="mb-2 text-2xl font-black">Share masterpiece</h3>
            <p className="text-sm text-muted-foreground mb-6">Spread the word about {anime.title} with a custom AI hook.</p>

            <div className="space-y-4">
              <div className="group relative rounded-2xl bg-white/5 p-5 border border-white/5 transition-smooth hover:border-white/10">
                {isGeneratingLine ? (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">AI is crafting a hook...</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-medium leading-relaxed italic text-foreground pr-8">
                      "{shareLine}"
                    </p>
                    <button 
                      onClick={handleCopyQuote}
                      className="absolute right-4 top-4 text-muted-foreground hover:text-primary transition-smooth opacity-0 group-hover:opacity-100"
                      title="Copy Quote Only"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={handleCopyLink}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white/10 py-4 text-sm font-bold transition-smooth hover:bg-white/15"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-success" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy Link
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-1 rounded-full glass p-1 sm:w-fit">
        {(["overview", "episodes"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded-full px-8 py-3 text-sm font-bold capitalize transition-smooth sm:flex-none",
              tab === t ? "bg-gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            {/* Genres & High-level info */}
            <div className="flex flex-wrap gap-2">
              {anime.genres.map((genre) => (
                <span key={genre} className="rounded-full bg-white/5 border border-white/5 px-4 py-1.5 text-xs font-bold text-muted-foreground transition-smooth hover:bg-primary/10 hover:text-primary hover:border-primary/20 cursor-default">
                  {genre}
                </span>
              ))}
              {anime.ageRating && (
                <span className="rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary">
                  {anime.ageRating}: {anime.ageRatingGuide}
                </span>
              )}
            </div>

            <div className="glass-strong rounded-3xl p-8 border border-white/5 relative overflow-hidden group">
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl group-hover:bg-primary/10 transition-smooth" />
              
              <h2 className="mb-8 text-xl font-black tracking-tight flex items-center gap-3">
                <div className="h-8 w-1.5 rounded-full bg-primary shadow-glow" />
                Synopsis
              </h2>

              {anime.aiReason && (
                <div className="mb-8 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 p-6 shadow-glow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-glow">
                      <Zap className="h-4 w-4 fill-current" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Discovery Insight</span>
                  </div>
                  <p className="text-sm font-bold text-foreground/90 italic leading-relaxed">
                    "{anime.aiReason}"
                  </p>
                </div>
              )}

              <p className={cn("text-base leading-relaxed text-muted-foreground/80 whitespace-pre-wrap transition-smooth font-medium selection:bg-primary/30", !expanded && "line-clamp-6")}>
                {anime.synopsis}
              </p>
              
              {anime.synopsis.length > 300 && (
                <div className="mt-8 pt-6 border-t border-white/5">
                  <button 
                    onClick={() => setExpanded((e) => !e)} 
                    className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-primary hover:text-primary/80 transition-smooth group/btn"
                  >
                    {expanded ? "Collapse Story" : "Unfold Masterpiece"}
                    <div className={cn("h-6 w-6 rounded-full border border-primary/20 flex items-center justify-center transition-transform group-hover/btn:scale-110", expanded && "rotate-180")}>
                      <ChevronDown className="h-3 w-3" />
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="glass-strong rounded-3xl p-8 border border-white/5 shadow-elevated">
              <h2 className="mb-8 text-xl font-black tracking-tight">Details</h2>
              <dl className="space-y-6">
                {[
                  ["Studio", anime.studio || "Unknown Studio"],
                  ["Format", anime.type.toUpperCase()],
                  ["Episodes", anime.status === "ongoing" && anime.episodes === 0 ? "Ongoing" : String(anime.episodes)],
                  ["Status", anime.status],
                  ["Released", String(anime.year)],
                  ["Score", `${(anime.rating / 10).toFixed(1)} / 10`],
                  ["Rating", anime.ageRatingGuide],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-2 group">
                    <dt className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/40 group-hover:text-primary/60 transition-colors">{k}</dt>
                    <dd className="text-sm font-black text-foreground/90 group-hover:text-foreground transition-colors">{v}</dd>
                    <div className="h-px w-full bg-gradient-to-r from-white/10 to-transparent mt-1" />
                  </div>
                ))}
              </dl>
            </div>
          </aside>
        </section>
      )}

      {tab === "episodes" && (
        <div className="space-y-12 animate-fade-in pb-32">
          {/* Cinematic Episode Header & Range Ribbon */}
          <div id="ep-list-header" className="space-y-10">
            <div className="flex items-center justify-between border-b border-white/5 pb-8">
              <div className="space-y-1">
                <div className="flex items-center gap-4">
                  <h2 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">
                    Episodes
                  </h2>
                  <div className="h-8 w-px bg-white/10" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-primary tracking-[0.2em] uppercase">Archive Total</span>
                    <span className="text-sm font-black text-white/90">{totalEpisodes} Files</span>
                  </div>
                </div>
              </div>
              
              <div className="hidden md:flex items-center gap-3 glass-strong px-5 py-2.5 rounded-2xl border border-white/5">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-glow" />
                <span className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">
                  Chapter {episodeOffset + 1} — {Math.min(episodeOffset + episodesPerPage, totalEpisodes)}
                </span>
              </div>
            </div>

            {/* Custom Range Ribbon with Fading Masks & Navigation */}
            {totalEpisodes > 50 && (
              <div className="relative group/ribbon">
                {/* Scroll Buttons */}
                <button 
                  onClick={() => {
                    const container = document.getElementById('range-ribbon-container');
                    if (container) container.scrollBy({ left: -400, behavior: 'smooth' });
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-30 h-10 w-10 flex items-center justify-center rounded-full bg-background/80 backdrop-blur-md border border-white/10 text-white opacity-0 group-hover/ribbon:opacity-100 transition-all duration-500 hover:bg-primary hover:border-primary shadow-glow"
                >
                  <ChevronDown className="h-5 w-5 rotate-90" />
                </button>

                <button 
                  onClick={() => {
                    const container = document.getElementById('range-ribbon-container');
                    if (container) container.scrollBy({ left: 400, behavior: 'smooth' });
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-30 h-10 w-10 flex items-center justify-center rounded-full bg-background/80 backdrop-blur-md border border-white/10 text-white opacity-0 group-hover/ribbon:opacity-100 transition-all duration-500 hover:bg-primary hover:border-primary shadow-glow"
                >
                  <ChevronDown className="h-5 w-5 -rotate-90" />
                </button>

                {/* Left Mask */}
                <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background via-background/40 to-transparent z-10 pointer-events-none" />
                
                {/* Scrollable Container */}
                <div 
                  id="range-ribbon-container"
                  className="overflow-x-auto no-scrollbar flex items-center gap-4 px-20 py-4 scroll-smooth"
                >
                  {Array.from({ length: Math.ceil(totalEpisodes / 50) }).map((_, i) => {
                    const start = i * 50;
                    const isActive = selectedRange === start;
                    return (
                      <button
                        key={i}
                        onClick={() => handleRangeChange(start)}
                        className={`
                          relative flex-shrink-0 px-10 py-5 rounded-[1.25rem] text-[11px] font-black tracking-[0.2em] uppercase transition-all duration-700
                          ${isActive 
                            ? "text-primary scale-110" 
                            : "text-muted-foreground/30 hover:text-white/80 hover:scale-105"
                          }
                        `}
                      >
                        {isActive && (
                          <div className="absolute inset-0 bg-primary/10 border border-primary/30 rounded-[1.25rem] -z-10 shadow-glow" />
                        )}
                        <span className="relative z-10">
                          {start + 1}—{Math.min((i + 1) * 50, totalEpisodes)}
                        </span>
                        {isActive && (
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary shadow-glow" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Right Mask */}
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background via-background/40 to-transparent z-10 pointer-events-none" />
              </div>
            )}
          </div>

          {isTabLoading ? (
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
               {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                 <div key={i} className="aspect-video animate-pulse rounded-[2.5rem] bg-white/5 border border-white/5" />
               ))}
            </div>
          ) : episodes.length > 0 ? (
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {episodes.map((ep) => {
                const thumbnailUrl = ep.attributes.thumbnail?.original || ep.attributes.thumbnail?.medium || anime.banner || anime.poster;
                const hasImage = !!thumbnailUrl;

                return (
                  <div key={ep.id} className="group relative overflow-hidden rounded-[2.5rem] bg-white/[0.02] border border-white/5">
                    <Link
                      to="/archive/$id"
                      params={{ id: anime.id as string }}
                      search={{ ep: ep.attributes.number.toString() }}
                      className="group relative aspect-video overflow-hidden rounded-[2.5rem] bg-white/5 border border-white/5 transition-all duration-700 hover:border-primary/50 hover:shadow-glow cursor-pointer block"
                    >
                      {hasImage ? (
                        <img 
                          src={thumbnailUrl} 
                          className={`h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110 saturate-[0.6] group-hover:saturate-[1.4] ${!ep.attributes.thumbnail ? 'opacity-40 group-hover:opacity-60 scale-125' : 'opacity-80 group-hover:opacity-100'}`}
                          alt={ep.attributes.canonicalTitle}
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-white/5 to-white/[0.02] flex items-center justify-center p-8">
                          <div className="flex flex-col items-center gap-4 opacity-20">
                            <Tv className="h-12 w-12" />
                            <span className="text-[8px] font-black tracking-[0.3em] uppercase">Archive Entry Missing</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-90 group-hover:opacity-70 transition-opacity" />
                      
                      {/* Premium Overlay for Fallback Banner */}
                      {!ep.attributes.thumbnail && hasImage && (
                        <div className="absolute inset-0 bg-primary/10 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}

                      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-500 group-hover:opacity-100 bg-primary/5 backdrop-blur-[1px]">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow scale-50 group-hover:scale-100 transition-all duration-700">
                          <BookOpen className="h-8 w-8 fill-current" />
                        </div>
                      </div>

                      <div className="absolute top-6 left-6">
                        <div className="rounded-2xl glass-strong px-4 py-2 text-[10px] font-black tracking-[0.2em] text-white shadow-2xl border border-white/10 group-hover:border-primary/40 transition-colors">
                          EP—{ep.attributes.number}
                        </div>
                      </div>
                    </Link>

                    <div className="p-8 space-y-5">
                      <h3 className="text-lg font-black line-clamp-1 group-hover:text-primary transition-colors tracking-tight leading-tight">
                        {ep.attributes.canonicalTitle || `Episode ${ep.attributes.number}`}
                      </h3>
                      <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors">
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-primary/60" /> {ep.attributes.length || 24} M
                        </div>
                        <div className="flex items-center gap-3">
                          <Star className="h-4 w-4 fill-primary/60 text-primary/60" /> 
                          <span className="text-white/50 group-hover:text-white/80">{ep.attributes.rating || '—'}</span>
                        </div>
                        {ep.attributes.isFiller && (
                          <div className="rounded-md bg-pink/10 px-2 py-0.5 text-pink/60 border border-pink/20">FILLER</div>
                        )}
                        {ep.attributes.isRecap && (
                          <div className="rounded-md bg-cyan/10 px-2 py-0.5 text-cyan/60 border border-cyan/20">RECAP</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass rounded-[3rem] p-40 text-center border-dashed border-white/5 flex flex-col items-center justify-center space-y-8">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                <div className="relative p-10 rounded-full bg-white/5 border border-white/10">
                  <Tv className="h-24 w-24 text-muted-foreground/10" />
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-white/40 font-black uppercase tracking-[0.4em] text-sm">Signal Lost</p>
                <p className="text-muted-foreground/20 text-[10px] font-black uppercase tracking-[0.2em]">End of Archive Stream</p>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "characters" && (
        <div className="space-y-6">
          {isTabLoading ? (
             <div className="flex flex-col items-center justify-center py-20 gap-4">
               <Loader2 className="h-10 w-10 animate-spin text-primary" />
               <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Finding cast...</p>
             </div>
          ) : characters.length > 0 ? (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {characters.map((char) => {
                const attrs = char.attributes;
                return (
                  <div key={char.id} className="group flex flex-col items-center gap-3 text-center">
                    <div className="relative h-32 w-32 overflow-hidden rounded-full border-2 border-white/10 p-1 transition-smooth group-hover:border-primary group-hover:scale-105 shadow-elevated">
                      <img 
                        src={attrs.image?.original || attrs.image?.medium || "https://placehold.co/200x200/1e1e2e/ffffff?text=?"} 
                        className="h-full w-full rounded-full object-cover"
                        alt={attrs.name}
                      />
                    </div>
                    <div>
                      <div className="text-sm font-bold line-clamp-1 group-hover:text-primary transition-colors">{attrs.name}</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 italic">{attrs.role || "Main"}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass rounded-3xl p-12 text-center border-dashed border-white/10">
              <Heart className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-20" />
              <p className="text-muted-foreground font-semibold">Character list unavailable</p>
            </div>
          )}
        </div>
      )}

      {related.length > 0 && (
        <AnimeRow title="You May Also Like" subtitle="Similar to what you're watching" anime={related} showMatch accent="purple" />
      )}

      <div className="text-xs text-muted-foreground pt-4 border-t border-white/5">
        <Link to="/browse" className="text-primary hover:underline">← Back to Browse</Link>
      </div>
    </div>
  );
}
