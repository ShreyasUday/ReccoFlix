import { createFileRoute, Link } from "@tanstack/react-router";
import { useLibrary } from "@/lib/library-context";
import { AnimeCard } from "@/components/anime-card";
import { Heart, Loader2, Sparkles } from "lucide-react";

export const Route = createFileRoute("/favorites")({
  head: () => ({ meta: [{ title: "My Favorites — ReccoFlix" }] }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const { library, isLoading } = useLibrary();
  
  const favorites = library.filter(item => !!item.is_favorite);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pink shadow-glow-pink">
          <Heart className="h-7 w-7 text-white fill-current" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold sm:text-4xl">
            My <span className="text-gradient-primary">Favorites</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {favorites.length} top-tier masterpieces
          </p>
        </div>
      </header>

      {favorites.length === 0 ? (
        <div className="glass rounded-3xl p-16 text-center border border-dashed border-white/10">
          <Heart className="mx-auto h-16 w-16 text-muted-foreground/20 mb-4" />
          <p className="text-lg font-bold text-muted-foreground">
            No favorites yet
          </p>
          <p className="mt-1 text-sm text-muted-foreground/60">
            Click the heart icon on any anime to add it to this collection.
          </p>
          <Link
            to="/browse"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-8 py-3 text-sm font-black text-primary-foreground shadow-glow"
          >
            Find Masterpieces
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 animate-fade-up">
          {favorites.map((item) => (
            <div key={item.anime_id} className="animate-fade-in">
                <AnimeCard 
                    anime={{
                        id: item.anime_id,
                        title: item.anime_title,
                        poster: item.poster_image,
                        rating: 85,
                        year: 2024,
                        studio: "Studio",
                        type: "TV",
                        status: "ongoing",
                        genres: [],
                        synopsis: ""
                    } as any}
                />
            </div>
          ))}
        </div>
      )}

      {favorites.length > 0 && (
         <section className="rounded-3xl bg-gradient-to-br from-primary/10 to-purple/10 p-8 border border-white/5">
            <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/5 backdrop-blur-xl">
                    <Sparkles className="h-8 w-8 text-primary shadow-glow" />
                </div>
                <div>
                    <h3 className="text-xl font-bold">Want more like these?</h3>
                    <p className="text-sm text-muted-foreground mt-1">Your favorites heavily influence our AI recommendation engine.</p>
                </div>
                <Link 
                    to="/recommendations"
                    className="sm:ml-auto rounded-full bg-gradient-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-glow whitespace-nowrap"
                >
                    View Recommendations
                </Link>
            </div>
         </section>
      )}
    </div>
  );
}
