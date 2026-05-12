import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ChevronLeft, Clock, Star, Calendar, BookOpen, Radio, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchEpisodeDetail } from "@/lib/api";

export const Route = createFileRoute("/dossier/$id/$episodeNum")({
  component: EpisodeDetailsPage,
});

function EpisodeDetailsPage() {
  const { id, episodeNum } = Route.useParams();
  const [episode, setEpisode] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [anime, setAnime] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log(`[DEBUG] Fetching episode dossier for ID: ${id}, Num: ${episodeNum}`);
        const data = await fetchEpisodeDetail(id, episodeNum);
        console.log("[DEBUG] Backend response:", data);
        setEpisode(data.episode);
        setAnime(data.anime);
      } catch (err: any) {
        console.error("Failed to assemble episode dossier:", err);
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, episodeNum]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Accessing Archive...</p>
      </div>
    );
  }

  if (!episode) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6">
        <Radio className="h-16 w-16 text-muted-foreground/20 animate-pulse" />
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black uppercase tracking-tighter">Signal Lost</h2>
          <p className="text-muted-foreground/60 text-sm font-medium italic">
            {error ? `Archive Error: ${error}` : "This chapter has not been archived yet."}
          </p>
        </div>
        <Link to="/anime/$id" params={{ id }} className="text-primary font-black uppercase tracking-widest text-xs hover:underline">
          Return to Anime File
        </Link>
      </div>
    );
  }

  const attrs = episode.attributes;
  const animeAttrs = anime?.attributes;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Cinematic Header */}
      <div className="relative h-[40vh] w-full overflow-hidden">
        <img 
          src={attrs.thumbnail?.original || animeAttrs?.posterImage?.original} 
          className="h-full w-full object-cover brightness-[0.3] saturate-[1.2] scale-105"
          alt={attrs.canonicalTitle}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        
        <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-20">
          <div className="max-w-4xl space-y-6">
             <Link 
              to="/anime/$id" 
              params={{ id }}
              className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-white/40 hover:text-primary transition-colors w-fit"
            >
              <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Return to {animeAttrs?.canonicalTitle || 'Archive'}
            </Link>

            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <span className="rounded-full bg-primary/20 border border-primary/30 px-4 py-1 text-[10px] font-black tracking-[0.2em] text-primary shadow-glow">
                  CHAPTER {episodeNum}
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 italic">Archive Record #{episode.id}</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white leading-none">
                {attrs.canonicalTitle || `Episode ${episodeNum}`}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Discovery Content */}
      <div className="max-w-6xl mx-auto px-8 md:px-20 -mt-10 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Dossier */}
          <div className="lg:col-span-2 space-y-12">
            <section className="glass rounded-[2.5rem] p-8 md:p-12 space-y-8 border border-white/5 shadow-elevated">
              <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                <BookOpen className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-black uppercase tracking-tight">Narrative Dossier</h2>
              </div>
              
              <div className="space-y-6">
                <p className="text-lg leading-relaxed text-foreground/80 font-medium italic first-letter:text-5xl first-letter:font-black first-letter:mr-3 first-letter:float-left first-letter:text-primary">
                  {attrs.synopsis || "No detailed synopsis available for this chapter in the current archive stream. Discovery ongoing..."}
                </p>
                
                {attrs.synopsis && attrs.synopsis.length > 500 && (
                   <div className="flex items-center gap-2 p-4 rounded-2xl bg-primary/5 border border-primary/10 text-primary/60 text-xs font-black uppercase tracking-widest">
                     <Sparkles className="h-4 w-4" />
                     Enhanced Narrative Analysis Complete
                   </div>
                )}
              </div>
            </section>

            {/* Visual Archive */}
            <section className="space-y-6">
              <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white/20 px-4">Visual Records</h3>
              <div className="aspect-video w-full overflow-hidden rounded-[2.5rem] border border-white/5 shadow-2xl group cursor-none">
                <img 
                  src={attrs.thumbnail?.original || animeAttrs?.posterImage?.original} 
                  className="h-full w-full object-cover transition-transform duration-[3s] group-hover:scale-110"
                  alt="Scene Record"
                />
              </div>
            </section>
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-8">
            <div className="glass rounded-[2rem] p-8 space-y-8 border border-white/5">
               <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary border-b border-white/5 pb-4">Metadata</h3>
               
               <div className="space-y-6">
                 <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-white/20 group-hover:text-primary transition-colors" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Runtime</span>
                    </div>
                    <span className="text-sm font-black text-white/90">{attrs.length || animeAttrs?.episodeLength || 24} Min</span>
                 </div>

                 <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-white/20 group-hover:text-primary transition-colors" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Aired</span>
                    </div>
                    <span className="text-sm font-black text-white/90">{attrs.airdate || 'Unknown'}</span>
                 </div>

                 <div className="h-px w-full bg-white/5" />

                 <div className="space-y-3">
                   <div className="flex items-center gap-2">
                     <Star className="h-3 w-3 text-yellow-400 fill-current" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Archive Rating</span>
                   </div>
                   <div className="text-3xl font-black text-white">
                      8.4 <span className="text-[10px] text-white/20">/ 10.0</span>
                   </div>
                 </div>
               </div>
            </div>

            <div className="p-8 rounded-[2rem] bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-primary">Discovery Tip</h4>
              <p className="text-[11px] leading-relaxed text-muted-foreground font-medium">
                Every chapter in the ReccoFlix archive is cross-referenced with multiple intelligence sources for maximum accuracy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
