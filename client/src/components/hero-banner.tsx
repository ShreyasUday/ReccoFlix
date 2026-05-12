import { Link } from "@tanstack/react-router";
import { Play, Plus, Info, Star, CheckCircle2, Loader2, ChevronLeft, ChevronRight, Radio, Compass } from "lucide-react";
import type { Anime } from "@/lib/mock-anime";
import { useState, useEffect, useCallback } from "react";
import { addToLibrary } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useLibrary } from "@/lib/library-context";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

interface HeroBannerProps {
  animeList: Anime[];
}

export function HeroBanner({ animeList }: HeroBannerProps) {
  const { isInLibrary, refreshLibrary, toggleLibrary } = useLibrary();
  const { isAuthenticated } = useAuth();
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(false);

  const anime = animeList[index] || animeList[0];
  const isAlreadyInLibrary = anime ? isInLibrary(anime.id) : false;

  const next = useCallback(() => {
    setIndex((prev) => (prev + 1) % animeList.length);
  }, [animeList.length]);

  const prev = () => {
    setIndex((prev) => (prev - 1 + animeList.length) % animeList.length);
  };

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(next, 8000);
    return () => clearInterval(timer);
  }, [next, isPaused]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!anime) return;
    
    if (!isAuthenticated) {
      toast.error("Sign in to track your library", {
        description: "Join ReccoFlix to build your personal anime collection.",
        action: { label: "Login", onClick: () => window.location.href = "/login" }
      });
      return;
    }

    setLoading(true);
    try {
      await toggleLibrary(anime);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!anime) return null;

  return (
    <section 
      className="group relative overflow-hidden rounded-[2rem] border border-white/5 bg-background shadow-elevated"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Layers */}
      <div className="absolute inset-0">
        {animeList.map((item, i) => (
          <div
            key={item.id}
            className={cn(
              "absolute inset-0 transition-opacity duration-1000 ease-in-out",
              i === index ? "opacity-100" : "opacity-0"
            )}
          >
            <img
              src={item.banner || item.poster}
              alt=""
              className="h-full w-full object-cover object-[center_25%] brightness-[0.5] saturate-[1.25] transition-transform duration-1000 group-hover:scale-105"
            />
          </div>
        ))}
        {/* Smarter Gradients for Readability without over-darkening */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent" />
      </div>

      <div className="relative flex flex-col justify-center gap-4 p-6 pb-20 h-[400px] sm:gap-6 sm:p-12 md:h-[550px] lg:p-16">
        {/* Content Section */}
        <div key={anime.id} className="max-w-2xl space-y-5 animate-fade-up">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em]">
            {anime.status === "ongoing" && (
              <span className="flex items-center gap-1.5 rounded-full bg-pink px-2.5 py-1 text-white shadow-glow-pink">
                <Radio className="h-3 w-3" /> Airing Now
              </span>
            )}
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-foreground backdrop-blur">
              {anime.type}
            </span>
            <span className="flex items-center gap-1 text-yellow-400">
              <Star className="h-3 w-3 fill-current" />
              {(anime.rating / 10).toFixed(1)}
            </span>
          </div>

          <h1 className="text-2xl font-black leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl line-clamp-2">
            {anime.title}
          </h1>

          <div className="flex flex-wrap gap-2">
            {anime.genres.slice(0, 3).map((g) => (
              <span key={g} className="text-xs font-semibold text-muted-foreground">
                # {g}
              </span>
            ))}
          </div>

          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground line-clamp-3 sm:text-base drop-shadow-sm">
            {anime.synopsis}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Link
              to="/anime/$id"
              params={{ id: anime.id }}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow-glow transition-smooth hover:scale-105 sm:px-8 sm:py-3.5 sm:text-sm"
            >
              <Compass className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Discover Story
            </Link>
              
              <div className="flex items-center gap-3 sm:gap-4">
                <Link
                  to="/anime/$id"
                  params={{ id: anime.id }}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full glass transition-smooth hover:bg-white/10 sm:h-12 sm:w-12"
                  title="More Info"
                >
                  <Info className="h-4 w-4 sm:h-5 sm:w-5" />
                </Link>

                <div className="relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle(e);
                    }}
                    disabled={loading}
                    className={cn(
                      "inline-flex h-10 w-10 items-center justify-center rounded-full glass transition-smooth z-10 sm:h-12 sm:w-12",
                      isAlreadyInLibrary ? "bg-success text-success-foreground shadow-glow-success" : "hover:bg-white/10"
                    )}
                  >
                    {loading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin sm:h-4 sm:w-4" />
                    ) : isAlreadyInLibrary ? (
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </button>
                </div>
              </div>
          </div>
        </div>
      </div>

      {/* Navigation Indicators */}
      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3 glass rounded-full px-4 py-2 sm:bottom-8 sm:right-8 sm:left-auto sm:translate-x-0">
        <button onClick={prev} className="text-muted-foreground hover:text-foreground transition-smooth" aria-label="Previous">
          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
        
        <div className="flex gap-1.5">
          {animeList.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={cn(
                "h-1 rounded-full transition-all duration-500",
                i === index ? "w-6 bg-primary shadow-glow sm:w-8" : "w-1.5 bg-white/20 sm:w-2"
              )}
            />
          ))}
        </div>

        <button onClick={next} className="text-muted-foreground hover:text-foreground transition-smooth" aria-label="Next">
          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>
    </section>
  );
}
