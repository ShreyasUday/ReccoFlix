import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  ChevronLeft, Clock, Star, Calendar, BookOpen, 
  Radio, Loader2, Sparkles, LayoutGrid, Search,
  ChevronRight, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchEpisodeDetail, fetchEpisodes, fetchAnimeDetails } from "@/lib/api";

export const Route = createFileRoute("/archive/$id")({
  component: ArchivePage,
});

function ArchivePage() {
  const { id } = Route.useParams();
  const search = Route.useSearch() as { ep?: string };
  const navigate = useNavigate();
  
  const [activeEp, setActiveEp] = useState(search.ep || "1");
  const [episode, setEpisode] = useState<any>(null);
  const [anime, setAnime] = useState<any>(null);
  const [allEpisodes, setAllEpisodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [epLoading, setEpLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination State
  const [selectedRange, setSelectedRange] = useState(0); // Offset
  const [totalEpisodes, setTotalEpisodes] = useState(0);

  // UI State
  const [isRangeOpen, setIsRangeOpen] = useState(false);

  // Initial Load (Anime details)
  useEffect(() => {
    const initLoad = async () => {
      setLoading(true);
      try {
        const animeData = await fetchAnimeDetails(id);
        setAnime(animeData.desc);
      } catch (err: any) {
        console.error("Archive initialization failed:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    initLoad();
  }, [id]);

  // Load Episodes for Selected Range
  useEffect(() => {
    const loadBatch = async () => {
      try {
        const epList = await fetchEpisodes(id, 50, selectedRange);
        setAllEpisodes(epList.data);
        setTotalEpisodes(epList.total);
      } catch (err) {
        console.error("Failed to load episode batch:", err);
      }
    };
    loadBatch();
  }, [id, selectedRange]);

  // Load Specific Episode Dossier
  useEffect(() => {
    const loadDossier = async () => {
      setEpLoading(true);
      try {
        const data = await fetchEpisodeDetail(id, activeEp);
        setEpisode(data.episode);
      } catch (err: any) {
        console.error("Episode dossier failed:", err);
        setEpisode(null);
      } finally {
        setEpLoading(false);
      }
    };
    loadDossier();
  }, [id, activeEp]);

  const handleEpSelect = (num: string) => {
    setActiveEp(num);
    const n = parseInt(num);
    const newRange = Math.floor((n - 1) / 50) * 50;
    if (newRange !== selectedRange) {
      setSelectedRange(newRange);
    }
    navigate({ search: { ep: num } });
  };

  // Sync range if activeEp changes from external source (like search param)
  useEffect(() => {
    const n = parseInt(activeEp);
    const targetRange = Math.floor((n - 1) / 50) * 50;
    if (targetRange !== selectedRange) {
      setSelectedRange(targetRange);
    }
  }, [activeEp]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse text-center">Synchronizing Archive...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6">
        <Radio className="h-16 w-16 text-destructive/20 animate-pulse" />
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black uppercase tracking-tighter text-destructive">Connection Severed</h2>
          <p className="text-muted-foreground/60 text-sm font-medium italic">{error}</p>
        </div>
        <Link to="/browse" className="text-primary font-black uppercase tracking-widest text-xs hover:underline">
          Return to Hub
        </Link>
      </div>
    );
  }

  const attrs = episode?.attributes;
  const animeAttrs = anime;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header Info */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link 
            to="/anime/$id" 
            params={{ id }}
            className="group flex items-center gap-3 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] text-white/40 hover:text-primary transition-all"
          >
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Return to {anime?.title || 'Archive'}
          </Link>
          
          <div className="flex items-center gap-4">
            <span className="text-[9px] sm:text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Source Log</span>
            <div className="h-px w-8 sm:w-12 bg-white/10" />
            <span className="text-xs sm:text-sm font-black text-primary uppercase tracking-tighter">Full Narrative</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
           <div className="space-y-2">
             <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-6xl font-black tracking-tighter text-white uppercase italic leading-[0.9] max-w-4xl">
               The {anime?.title} <span className="text-primary">Logs</span>
             </h1>
             <p className="text-[10px] sm:text-xs md:text-sm font-medium text-muted-foreground/60 max-w-xl">
               Complete chronological record of all intercepted chapters and narrative analyses.
             </p>
           </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
        
        {/* Left Sidebar: Episode Picker */}
        <aside className="lg:col-span-4 xl:col-span-3 space-y-6">
          <div className="glass rounded-[1.5rem] p-4 sm:p-6 border border-white/5 space-y-5 lg:sticky lg:top-24 max-w-full md:max-w-3xl mx-auto lg:mx-0">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Chapters</h3>
                <div className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[8px] font-black text-primary border border-primary/20 whitespace-nowrap">
                  {totalEpisodes} Records
                </div>
              </div>

              {/* Custom Range Dropdown */}
              {totalEpisodes > 50 && (
                <div className="relative">
                  <button 
                    onClick={() => setIsRangeOpen(!isRangeOpen)}
                    className={cn(
                      "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[9px] font-black uppercase tracking-widest text-white/60 flex items-center justify-between transition-all hover:bg-white/10",
                      isRangeOpen && "border-primary/40 text-primary bg-primary/5 shadow-glow"
                    )}
                  >
                    <span>Log: {selectedRange + 1} — {Math.min(selectedRange + 50, totalEpisodes)}</span>
                    <ChevronRight className={cn("h-3 w-3 shrink-0 transition-transform", isRangeOpen ? "rotate-90" : "rotate-0")} />
                  </button>
                  
                  {isRangeOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 z-50 glass-strong border border-white/10 rounded-xl overflow-hidden shadow-elevated animate-fade-in">
                      <div className="max-h-60 overflow-y-auto no-scrollbar">
                        {Array.from({ length: Math.ceil(totalEpisodes / 50) }).map((_, i) => {
                          const start = i * 50;
                          const isActive = selectedRange === start;
                          return (
                            <button
                              key={i}
                              onClick={() => {
                                setSelectedRange(start);
                                setIsRangeOpen(false);
                              }}
                              className={cn(
                                "w-full text-left px-4 py-3 text-[9px] font-black uppercase tracking-widest transition-colors border-b border-white/5 last:border-0",
                                isActive 
                                  ? "bg-primary text-primary-foreground" 
                                  : "text-white/40 hover:bg-white/5 hover:text-white"
                              )}
                            >
                              Log: {start + 1} — {Math.min((i + 1) * 50, totalEpisodes)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-5 gap-2 max-h-[20vh] lg:max-h-[40vh] overflow-y-auto no-scrollbar pr-1 p-2">
              {allEpisodes.map((ep) => {
                const num = ep.attributes.number.toString();
                const isActive = activeEp === num;
                return (
                  <button
                    key={ep.id}
                    onClick={() => handleEpSelect(num)}
                    className={cn(
                      "aspect-square rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-black transition-all border",
                      isActive 
                        ? "bg-primary text-primary-foreground border-primary shadow-glow scale-110 z-10" 
                        : "bg-white/5 border-white/5 text-muted-foreground/40 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {num}
                  </button>
                );
              })}
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Discovery Tip</span>
              </div>
              <p className="text-[10px] leading-relaxed text-muted-foreground/80 font-medium">
                Select a chapter number to initialize AI narrative extraction.
              </p>
            </div>
          </div>
        </aside>

        {/* Main Area: Dossier Content */}
        <main className="lg:col-span-8 xl:col-span-9">
          {epLoading ? (
            <div className="glass rounded-[2rem] sm:rounded-[3rem] h-[40vh] lg:h-[65vh] flex flex-col items-center justify-center gap-6 border border-white/5">
               <div className="relative">
                 <div className="absolute inset-0 bg-primary/20 blur-3xl animate-pulse" />
                 <Loader2 className="h-12 w-12 animate-spin text-primary relative" />
               </div>
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 animate-pulse">Extracting Narrative...</p>
            </div>
          ) : episode ? (
            <div className="space-y-6 sm:space-y-10 animate-fade-in">
              {/* Cinematic Scene Card */}
              <div className="relative aspect-video xl:aspect-[21/9] w-full overflow-hidden rounded-[2rem] sm:rounded-[3rem] border border-white/5 shadow-2xl group">
                <img 
                  src={attrs.thumbnail?.original || anime?.banner} 
                  className="h-full w-full object-cover saturate-[1.2] brightness-[0.4] sm:brightness-[0.6] transition-transform duration-[4s] group-hover:scale-110"
                  alt="Archive Visual"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                
                <div className="absolute bottom-6 left-6 sm:bottom-12 sm:left-12 right-6 space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className="rounded-full bg-primary px-3 sm:px-5 py-1 sm:py-1.5 text-[8px] sm:text-[9px] font-black tracking-[0.2em] text-primary-foreground shadow-glow">
                      CHAPTER {activeEp}
                    </span>
                    <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-white/40 italic">Unit #{episode.id}</span>
                  </div>
                  <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter text-white leading-[0.95]">
                    {attrs.canonicalTitle || `Episode ${activeEp}`}
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-10">
                {/* Dossier Text */}
                <div className="xl:col-span-8 space-y-8 lg:space-y-10 order-2 xl:order-1">
                   <section className="glass rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 lg:p-12 xl:p-16 space-y-8 lg:space-y-10 border border-white/5 relative overflow-hidden">
                      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
                      
                      <div className="flex items-center gap-4 border-b border-white/5 pb-6 sm:pb-8">
                        <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                        <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight italic underline decoration-primary/30 decoration-4 underline-offset-8">Narrative Analysis</h3>
                      </div>

                      <div className="space-y-6 sm:space-y-8">
                        <p className="text-base sm:text-lg xl:text-xl leading-[1.8] text-foreground/80 font-medium italic first-letter:text-4xl sm:first-letter:text-5xl xl:first-letter:text-6xl first-letter:font-black first-letter:mr-3 sm:first-letter:mr-4 first-letter:float-left first-letter:text-primary first-letter:mt-1">
                          {attrs.synopsis || "Archival gap detected. Narrative data is currently being synthesized from intelligence streams. Check back soon for deep analysis."}
                        </p>
                        
                        {attrs.synopsis && (
                          <div className="inline-flex items-center gap-3 px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl bg-success/10 border border-success/20 text-success text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em]">
                            <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            AI Insight Stream Confirmed
                          </div>
                        )}
                      </div>
                   </section>

                   <div className="flex items-center justify-between p-6 sm:p-10 glass rounded-[2rem] sm:rounded-[2.5rem] border border-white/5 group cursor-pointer hover:bg-white/5 transition-colors">
                      <div className="space-y-1">
                        <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-primary">Next Phase</p>
                        <h4 className="text-lg sm:text-xl font-black tracking-tighter">Continue Discovery</h4>
                      </div>
                      <button 
                        onClick={() => handleEpSelect((parseInt(activeEp) + 1).toString())}
                        className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-primary group-hover:border-primary group-hover:text-primary-foreground transition-all duration-500"
                      >
                        <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6" />
                      </button>
                   </div>
                </div>

                {/* Sidebar Stats */}
                <div className="xl:col-span-4 space-y-6 sm:space-y-8 order-1 xl:order-2">
                   <div className="glass rounded-[1.5rem] sm:rounded-[2rem] p-8 sm:p-10 border border-white/5 space-y-8 lg:space-y-10">
                      <h4 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-primary">Intelligence Data</h4>
                      
                      <div className="grid grid-cols-1 xs:grid-cols-2 xl:grid-cols-1 gap-6 sm:gap-8">
                         <div className="space-y-2 group">
                            <div className="flex items-center gap-3">
                              <Clock className="h-4 w-4 text-white/20 group-hover:text-primary transition-colors" />
                              <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Airtime Record</span>
                            </div>
                            <p className="text-lg sm:text-xl font-black text-white">{attrs.length || 24} <span className="text-[8px] sm:text-[10px] text-white/20">MINUTES</span></p>
                         </div>

                         <div className="space-y-2 group">
                            <div className="flex items-center gap-3">
                              <Calendar className="h-4 w-4 text-white/20 group-hover:text-primary transition-colors" />
                              <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Intercepted On</span>
                            </div>
                            <p className="text-lg sm:text-xl font-black text-white">
                              {attrs.airdate 
                                ? new Date(attrs.airdate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                                : 'Unknown Epoch'}
                            </p>
                         </div>
                      </div>

                      <div className="h-px w-full bg-white/5" />

                      <div className="space-y-4">
                         <div className="flex items-center gap-2">
                            <Star className="h-3.5 w-3.5 text-primary fill-current" />
                            <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Archive Rating</span>
                         </div>
                         <div className="flex items-baseline gap-2">
                            <span className="text-4xl sm:text-5xl font-black text-white tracking-tighter">8.4</span>
                            <span className="text-[10px] sm:text-xs font-black text-white/20">/ 10.0</span>
                         </div>
                      </div>
                   </div>

                   <div className="glass rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 border border-white/5 bg-gradient-to-br from-primary/5 to-transparent">
                      <div className="flex items-center gap-3 mb-4">
                         <LayoutGrid className="h-4 w-4 text-primary" />
                         <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white/80">Archivist Note</span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] leading-relaxed text-muted-foreground font-medium italic">
                        "The narrative weights are shifting. Every chapter reveals more about the true power structure within the institution."
                      </p>
                   </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass rounded-[2rem] sm:rounded-[3rem] h-[50vh] lg:h-[70vh] flex flex-col items-center justify-center gap-6 border border-white/5 p-8 text-center">
               <Radio className="h-16 sm:h-20 w-16 sm:w-20 text-white/5 animate-pulse" />
               <div className="space-y-2">
                 <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tighter">Data Corruption</h3>
                 <p className="text-xs sm:text-sm text-muted-foreground/40 italic">Archive record for Unit #{activeEp} is unreadable.</p>
               </div>
               <button 
                onClick={() => handleEpSelect("1")}
                className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-full bg-primary/10 border border-primary/20 text-primary text-[8px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-all"
               >
                 Re-Initialize Archives
               </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
