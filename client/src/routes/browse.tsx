import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { genres, type Anime } from "@/lib/mock-anime";
import { AnimeCard } from "@/components/anime-card";
import { fetchBrowse } from "@/lib/api";
import { Filter, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/browse")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      category: (search.category as string) || "action",
      status: (search.status as string) || "",
      offset: (search.offset as number) || 0,
    };
  },
  head: () => ({
    meta: [
      { title: "Browse — ReccoFlix" },
      { name: "description", content: "Browse anime by genre and popularity." },
    ],
  }),
  component: BrowsePage,
});

function BrowsePage() {
  const search = Route.useSearch();
  const activeCategory = (search.category as string) || "action";
  const status = (search.status as string) || "";
  const offset = (search.offset as number) || 0;

  const [items, setItems] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasNext, setHasNext] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    // Add a small delay or unique ID to avoid any race conditions
    fetchBrowse(activeCategory, offset, status)
      .then((data) => {
        setItems(data.items);
        setHasNext(data.hasNextPage);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [activeCategory, offset, status]);

  const handleCategoryChange = (cat: string) => {
    const slug = cat.toLowerCase().replace(/ /g, "-");
    navigate({ to: "/browse", search: { category: slug, status, offset: 0 } });
  };

  const toggleStatus = (newStatus: string) => {
    const s = status === newStatus ? "" : newStatus;
    navigate({ to: "/browse", search: { category: activeCategory, status: s, offset: 0 } });
  };

  const handlePageChange = (newOffset: number) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    navigate({ to: "/browse", search: { category: activeCategory, status, offset: newOffset } });
  };

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          <span className="text-gradient-primary">Browse</span> the Universe
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Discover anime across every genre.</p>
      </header>

      {/* Genre Categories */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <Filter className="h-4 w-4 text-primary" />
          Categories
        </h2>
        <div className="flex flex-wrap gap-2 sm:gap-2.5">
          {genres.map((g) => {
            const slug = g.toLowerCase().replace(/ /g, "-");
            const isActive = activeCategory === slug;
            return (
              <button
                key={g}
                onClick={() => handleCategoryChange(g)}
                className={cn(
                  "rounded-full px-5 py-2.5 text-xs font-bold tracking-wide transition-all duration-300 border hover:scale-[1.03] active:scale-[0.97]",
                  isActive
                    ? "border-primary bg-gradient-primary/20 text-white shadow-glow"
                    : "border-white/5 bg-white/[0.02] text-muted-foreground hover:border-white/20 hover:bg-white/5 hover:text-white",
                )}
              >
                {g}
              </button>
            );
          })}
        </div>
      </section>

      {/* Results */}
      <section className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold capitalize">
                {status === "current" && <span className="mr-2 inline-flex h-2 w-2 animate-ping rounded-full bg-destructive" />}
                {status === "current" ? "Currently Airing" : activeCategory.replace(/-/g, " ")} Results
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
                {status === "current" ? "Showing only live seasons" : `Exploring ${activeCategory}`}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Status Filter */}
            <div className="flex items-center rounded-xl glass p-1">
                <button 
                    onClick={() => toggleStatus("")}
                    className={cn(
                        "rounded-lg px-4 py-1.5 text-xs font-bold transition-smooth",
                        status === "" ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    All
                </button>
                <button 
                    onClick={() => toggleStatus("current")}
                    className={cn(
                        "flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-bold transition-smooth",
                        status === "current" ? "bg-destructive/20 text-destructive shadow-glow-destructive" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <span className={cn("h-1.5 w-1.5 rounded-full", status === "current" ? "bg-destructive animate-pulse" : "bg-muted-foreground")} />
                    Live
                </button>
            </div>

            <div className="h-6 w-px bg-white/5 mx-1" />

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(Math.max(0, offset - 20))}
                disabled={offset === 0 || loading}
                className="flex h-10 w-10 items-center justify-center rounded-xl glass hover:bg-white/10 disabled:opacity-30 transition-smooth"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => handlePageChange(offset + 20)}
                disabled={!hasNext || loading}
                className="flex h-10 w-10 items-center justify-center rounded-xl glass hover:bg-white/10 disabled:opacity-30 transition-smooth"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="glass rounded-3xl p-20 text-center">
            <p className="text-muted-foreground">No anime found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 animate-fade-up">
            {items.map((a) => (
              <AnimeCard key={a.id} anime={a} size="sm" />
            ))}
          </div>
        )}

        {/* Pagination Bottom */}
        {!loading && items.length > 0 && (
          <div className="mt-10 flex justify-center gap-4">
            <button
              onClick={() => handlePageChange(Math.max(0, offset - 20))}
              disabled={offset === 0 || loading}
              className="flex items-center gap-2 rounded-xl glass-strong px-6 py-2.5 text-sm font-bold hover:bg-white/10 disabled:opacity-30 transition-smooth"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            <button
              onClick={() => handlePageChange(offset + 20)}
              disabled={!hasNext || loading}
              className="flex items-center gap-2 rounded-xl bg-gradient-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-glow disabled:opacity-30 transition-smooth"
            >
              Next Page <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
