import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search as SearchIcon, X, Loader2 } from "lucide-react";
import { fetchSearch } from "@/lib/api";
import type { Anime } from "@/lib/mock-anime";
import { AnimeCard } from "@/components/anime-card";

type SearchParams = {
  q?: string;
};

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    return {
      q: (search.q as string) || "",
    };
  },
  head: () => ({
    meta: [
      { title: "Search — ReccoFlix" },
      { name: "description", content: "Search anime by title, studio, or genre." },
    ],
  }),
  component: SearchPage,
});

const trendingQueries = ["Demon Slayer", "Frieren", "Action", "Movie", "MAPPA", "2023"];

function SearchPage() {
  const { q: urlQ } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [q, setQ] = useState(urlQ || "");
  const [results, setResults] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);

  // Sync state with URL when URL changes (e.g. from navbar search)
  useEffect(() => {
    if (urlQ !== undefined) {
      setQ(urlQ);
    }
  }, [urlQ]);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      // Update URL to reflect empty search
      navigate({ search: (prev) => ({ ...prev, q: "" }), replace: true });
      return;
    }

    // Update URL as user types (debounced update for URL but immediate search logic)
    const urlTimer = setTimeout(() => {
      navigate({ search: (prev) => ({ ...prev, q: q }), replace: true });
    }, 500);
    
    const searchTimer = setTimeout(async () => {
      setLoading(true);
      const data = await fetchSearch(q);
      setResults(data);
      setLoading(false);
    }, 500);

    return () => {
      clearTimeout(urlTimer);
      clearTimeout(searchTimer);
    };
  }, [q, navigate]);

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <div className="relative pt-8 text-center">
        <h1 className="text-3xl font-extrabold sm:text-5xl">
          Find your next <span className="text-gradient-primary">obsession</span>
        </h1>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">Search 50,000+ anime by title, studio, genre, or year.</p>
      </div>

      <div className="relative">
        <div className="absolute -inset-1 rounded-full bg-gradient-primary opacity-30 blur-2xl" />
        <div className="relative flex items-center gap-2 rounded-full glass-strong p-2 pl-5 shadow-elevated transition-smooth focus-within:ring-2 focus-within:ring-primary/40">
          <SearchIcon className="h-5 w-5 text-primary" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Anime title, studio, or genre..."
            className="flex-1 bg-transparent py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {q && (
            <button onClick={() => setQ("")} className="rounded-full p-2 text-muted-foreground hover:bg-white/10 hover:text-foreground" aria-label="Clear">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {!q && (
        <div>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">Trending Searches</h2>
          <div className="flex flex-wrap gap-2">
            {trendingQueries.map((t) => (
              <button
                key={t}
                onClick={() => setQ(t)}
                className="rounded-full glass px-4 py-2 text-sm font-semibold transition-smooth hover:bg-primary/20 hover:scale-105"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {q && (
        <div>
          <h2 className="mb-6 text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Searching...</>
            ) : (
              <>{results.length} {results.length === 1 ? "result" : "results"} for "{q}"</>
            )}
          </h2>
          {!loading && results.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center border border-dashed border-white/10">
              <SearchIcon className="mx-auto h-12 w-12 text-muted-foreground opacity-20 mb-4" />
              <p className="text-muted-foreground">No anime found. Try a different search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 animate-fade-up">
              {results.map((a) => (
                <AnimeCard key={a.id} anime={a} size="sm" />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
