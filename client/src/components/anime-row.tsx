import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimeCard } from "./anime-card";
import type { Anime } from "@/lib/mock-anime";

interface AnimeRowProps {
  title: string;
  subtitle?: string;
  anime: Anime[];
  showProgress?: boolean;
  showMatch?: boolean;
  accent?: "primary" | "purple" | "cyan" | "pink";
}

const accentBars = {
  primary: "bg-gradient-primary",
  purple: "bg-gradient-purple",
  cyan: "bg-gradient-cyan",
  pink: "bg-pink",
};

export function AnimeRow({ title, subtitle, anime, showProgress, showMatch, accent = "primary" }: AnimeRowProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -el.clientWidth * 0.8 : el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section className="relative">
      <div className="mb-4 flex items-end justify-between gap-4 px-1">
        <div className="flex items-center gap-3">
          <span className={`h-7 w-1.5 rounded-full ${accentBars[accent]}`} />
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <button
            onClick={() => scroll("left")}
            aria-label="Previous"
            className="flex h-9 w-9 items-center justify-center rounded-full glass transition-smooth hover:bg-primary/20"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            aria-label="Next"
            className="flex h-9 w-9 items-center justify-center rounded-full glass transition-smooth hover:bg-primary/20"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative">
        <div
          ref={scrollerRef}
          className="no-scrollbar grid grid-cols-2 xs:grid-cols-3 gap-3 overflow-x-auto scroll-smooth pb-4 pt-2 sm:flex sm:gap-4 sm:pl-1 sm:pr-8"
        >
          {anime.map((a) => (
            <AnimeCard key={a.id} anime={a} showProgress={showProgress} showMatch={showMatch} size="sm" layout="row" />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-16 bg-gradient-to-l from-background to-transparent sm:block" />
      </div>
    </section>
  );
}
