import { createFileRoute, Link } from "@tanstack/react-router";
import { HeroBanner } from "@/components/hero-banner";
import { AnimeRow } from "@/components/anime-row";
import { fetchTrending, fetchBrowse, fetchLibrary, fetchOngoing, fetchRecommendations } from "@/lib/api";
import { Sparkles, TrendingUp, Flame, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useLibrary } from "@/lib/library-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Home — ReccoFlix" },
      { name: "description", content: "Your premium anime dashboard. Continue watching, trending, and AI-powered picks." },
    ],
  }),
  loader: async () => {
    const [trending, ongoing, browse, library] = await Promise.all([
      fetchTrending().catch(() => []),
      fetchOngoing().catch(() => []),
      fetchBrowse("action", 0).catch(() => ({ items: [], hasNextPage: false })),
      fetchLibrary().catch(() => []),
    ]);
    return { trending, ongoing, browse, library };
  },
  component: HomePage,
});

function HomePage() {
  const { trending, ongoing, browse } = Route.useLoaderData();
  const { library, isLoading: isLibraryLoading } = useLibrary(); // Use live library and loading state
  const [recommendations, setRecommendations] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(true);

  useEffect(() => {
    // Only calculate if we're not already loading the library
    if (isLibraryLoading) return;

    setIsCalculating(true);
    const delay = setTimeout(() => {
      fetchRecommendations()
        .then(res => {
          setRecommendations(res);
          setIsCalculating(false);
        })
        .catch(() => {
          setRecommendations({ confidence: 0, message: "Global Discovery" });
          setIsCalculating(false);
        });
    }, 800);
    
    return () => clearTimeout(delay);
  }, [library.length, isLibraryLoading]); // Only re-run if count changes or loading finishes
  
  // Use the top 10 ONGOING anime for the hero carousel (makes the app feel live)
  const featuredAnimes = ongoing.length > 0 ? ongoing.slice(0, 10) : trending.slice(0, 10);
  
  // The rows will show the trending list
  const trendingRows = trending;

  const watchingCount = library.filter((a: any) => a.status === "watching").length;

  const getAIMatchInfo = () => {
    if (isCalculating || isLibraryLoading) return { val: "AI Match", sub: "Analyzing library...", glow: "shadow-glow-purple", anim: "animate-pulse" };
    if (!recommendations || library.length === 0) return { val: "Global", sub: "Guest Discovery", glow: "shadow-glow-purple", anim: "" };
    
    const conf = recommendations.confidence || 0;
    const msg = recommendations.message || "Calibrating...";
    
    // If confidence is low, encourage adding more anime
    if (conf < 70) return { val: `${conf}%`, sub: "Add more to refine", glow: "shadow-glow-yellow", anim: "" };
    if (conf < 90) return { val: `${conf}%`, sub: "Great Match", glow: "shadow-glow-cyan", anim: "" };
    return { val: `${conf}%`, sub: "Precision Pick", glow: "shadow-glow-purple", anim: "" };
  };

  const aiInfo = getAIMatchInfo();

  return (
    <div className="space-y-12">
      {featuredAnimes.length > 0 && <HeroBanner animeList={featuredAnimes} library={library} />}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { 
            label: "Watching", 
            value: String(watchingCount), 
            icon: Clock, 
            glow: "shadow-glow-success", 
            to: "/library?status=watching", 
            anim: "",
            sub: "Your Progress"
          },
          { 
            label: "Trending", 
            value: "Top 20", 
            icon: TrendingUp, 
            glow: "shadow-glow", 
            to: "/browse", 
            search: { category: "trending" },
            anim: "",
            sub: "World's Best"
          },
          { 
            label: "AI Match", 
            value: aiInfo.val, 
            icon: Sparkles, 
            glow: aiInfo.glow, 
            to: "/recommendations", 
            anim: aiInfo.anim,
            sub: aiInfo.sub
          },
          { 
            label: "Hot Now", 
            value: "🔥 Live", 
            icon: Flame, 
            glow: "shadow-glow-pink", 
            to: "/browse", 
            search: { category: "trending", status: "current" },
            anim: "",
            sub: "Airing Now"
          },
        ].map((s) => (
          <Link 
            key={s.label} 
            to={s.to as any}
            search={s.search}
            className={cn(
                "glass group rounded-2xl p-3 sm:p-4 transition-smooth hover:scale-[1.02] hover:bg-white/5",
                s.glow
            )}
          >
            <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2 xs:gap-3">
              <div className={cn(
                  "flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground transition-transform group-hover:rotate-6",
                  s.anim
              )}>
                <s.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <div className="flex-1 overflow-hidden min-w-0">
                <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground truncate">{s.label}</div>
                <div className="flex items-center gap-1.5 text-base sm:text-lg font-black tracking-tight">
                    <span className="truncate">{s.value}</span>
                    {s.label === "Hot Now" && (
                        <span className="relative flex h-2 w-2 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                        </span>
                    )}
                </div>
                <div className="text-[8px] sm:text-[9px] font-bold text-primary/60 truncate italic">{s.sub}</div>
              </div>
            </div>
          </Link>
        ))}
      </section>

      {trendingRows.length > 0 && (
        <AnimeRow title="Trending This Week" subtitle="What everyone's talking about" anime={trendingRows} accent="primary" />
      )}

      {browse.items && browse.items.length > 0 && (
        <AnimeRow title="Discover More" subtitle="Browse the full library" anime={browse.items} accent="cyan" />
      )}
    </div>
  );
}
