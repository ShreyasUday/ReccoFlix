import { Link } from "@tanstack/react-router";
import { Star, Play, Bookmark, Plus, CheckCircle2, Sparkles, Heart } from "lucide-react";
import type { Anime } from "@/lib/mock-anime";
import { cn } from "@/lib/utils";
import { useLibrary } from "@/lib/library-context";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

const statusGlow: Record<string, string> = {
  watching: "shadow-glow-success",
  completed: "shadow-glow-cyan",
  planned: "shadow-glow",
  favorite: "shadow-glow-pink",
  "on-hold": "shadow-glow-purple",
  dropped: "",
};

const statusLabel: Record<string, string> = {
  watching: "Watching",
  completed: "Completed",
  planned: "Planned",
  favorite: "Favorite",
  "on-hold": "On Hold",
  dropped: "Dropped",
};

const statusBadgeColor: Record<string, string> = {
  watching: "bg-success/90 text-background",
  completed: "bg-cyan/90 text-background",
  planned: "bg-primary/90 text-primary-foreground",
  favorite: "bg-pink/90 text-background",
  "on-hold": "bg-secondary/90 text-secondary-foreground",
  dropped: "bg-muted/90 text-muted-foreground",
};

interface AnimeCardProps {
  anime: Anime;
  size?: "sm" | "md" | "lg";
  showProgress?: boolean;
  showMatch?: boolean;
  layout?: "grid" | "row";
}

export function AnimeCard({ anime, size = "md", showProgress, showMatch, layout = "grid" }: AnimeCardProps) {
  const { getAnimeStatus, toggleFavorite, toggleLibrary, isFavorite } = useLibrary();
  const { isAuthenticated } = useAuth();
  const userStatus = getAnimeStatus(anime.id);
  const favorited = isFavorite(anime.id);

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error("Sign in to build your library", {
        description: "Login to save your watching progress and get AI picks.",
        action: { label: "Login", onClick: () => window.location.href = "/login" }
      });
      return;
    }
    await toggleFavorite(anime);
  };

  const handleLibrary = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error("Sign in to build your library", {
        description: "Login to save your watching progress and get AI picks.",
        action: { label: "Login", onClick: () => window.location.href = "/login" }
      });
      return;
    }
    await toggleLibrary(anime);
  };

  const widths = {
    sm: "w-full sm:w-40 md:w-44 xl:w-48",
    md: "w-full sm:w-52 md:w-56 xl:w-60",
    lg: "w-full sm:w-60 md:w-64 xl:w-72",
  };

  return (
    <Link
      to="/anime/$id"
      params={{ id: anime.id }}
      className={cn(
        "group relative p-1 transition-all duration-300",
        layout === "grid" ? "w-full" : cn("shrink-0", widths[size])
      )}
    >
      <div
        className={cn(
          "anime-card-hover relative overflow-hidden rounded-2xl border border-white/5 bg-card",
          userStatus && statusGlow[userStatus],
        )}
      >
        <div className="aspect-[2/3] overflow-hidden">
          <img
            src={anime.poster}
            alt={anime.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        </div>

        {/* Top right: status */}
        {userStatus && (
          <div className="absolute right-2 top-2 z-10">
            <span className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-bold backdrop-blur-md shadow-sm",
              statusBadgeColor[userStatus],
            )}>
              {statusLabel[userStatus]}
            </span>
          </div>
        )}

        {/* Top left: match % */}
        {showMatch && anime.matchPercent && (
          <div className="absolute left-2 top-2 rounded-full bg-gradient-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground shadow-glow">
            {anime.matchPercent}% Match
          </div>
        )}

        {/* Bottom right: rating pill */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-background/70 px-2 py-1 text-xs font-semibold backdrop-blur">
          <Star className="h-3 w-3 fill-primary text-primary" />
          <span className="text-foreground">{(anime.rating / 10).toFixed(1)}</span>
        </div>

        {/* Hover overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Hover quick actions */}
        <div className="absolute inset-x-2 bottom-2 flex translate-y-2 items-center gap-1 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!isAuthenticated) {
                toast.error("Sign in to build your library", {
                  description: "Login to save your watching progress and get AI picks.",
                  action: { label: "Login", onClick: () => window.location.href = "/login" }
                });
                return;
              }
            }}
            className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow"
            aria-label="Play"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
          </button>
          
          <div className="flex-1" />

          {/* Heart (Favorite) Button */}
          <button
            type="button"
            onClick={handleFavorite}
            className={cn(
              "pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200",
              favorited 
                ? "bg-pink text-white shadow-glow-pink" 
                : "glass-strong hover:bg-white/10 text-white"
            )}
            aria-label="Favorite"
          >
            <Heart className={cn("h-4 w-4", favorited && "fill-current")} />
          </button>

          {/* Plus (Library) Button */}
          <button
            type="button"
            onClick={handleLibrary}
            className={cn(
                "pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200",
                userStatus 
                    ? "bg-success text-success-foreground shadow-glow-success" 
                    : "glass-strong hover:bg-white/10"
            )}
            aria-label="Library"
          >
            {userStatus ? <CheckCircle2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </button>
        </div>

        {/* Progress bar */}
        {showProgress && anime.progress && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-background/60">
            <div
              className="h-full bg-gradient-primary"
              style={{ width: `${(anime.progress.current / anime.progress.total) * 100}%` }}
            />
          </div>
        )}
      </div>

      <div className="mt-2 px-1">
        <h3 className="line-clamp-1 text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
          {anime.title}
        </h3>
        
        {/* AI Reason */}
        {anime.aiReason && (
          <div className="mt-1 flex items-center gap-1 text-[10px] font-medium text-primary/80">
            <Sparkles className="h-3 w-3" />
            <span className="line-clamp-1 italic">{anime.aiReason}</span>
          </div>
        )}

        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
          {anime.studio} · {anime.year}
        </p>
        {showProgress && anime.progress && (
          <p className="mt-1 text-[10px] font-medium text-primary">
            EP {anime.progress.current} / {anime.progress.total}
          </p>
        )}
      </div>
    </Link>
  );
}
