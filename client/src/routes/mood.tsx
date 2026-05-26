import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { fetchMoodAnime } from "@/lib/api";
import {
  Sparkles, Star, Loader2, ArrowLeft, Coffee, Zap, Heart,
  Brain, Laugh, Ghost, Swords, Compass,
} from "lucide-react";

export const Route = createFileRoute("/mood")({
  head: () => ({ meta: [{ title: "Mood Picker — ReccoFlix" }] }),
  component: MoodPage,
});

const MOODS = [
  { id: "cozy", label: "Cozy", desc: "Warm, wholesome slice-of-life vibes", icon: Coffee, gradient: "from-amber-500 to-orange-600" },
  { id: "action", label: "Action Rush", desc: "Adrenaline-pumping battles & fights", icon: Zap, gradient: "from-yellow-400 to-red-500" },
  { id: "romantic", label: "Romantic", desc: "Heartfelt love stories & confessions", icon: Heart, gradient: "from-pink-400 to-rose-600" },
  { id: "mind-bending", label: "Mind-bending", desc: "Psychological twists & deep plots", icon: Brain, gradient: "from-violet-500 to-purple-700" },
  { id: "comedy", label: "Comedy", desc: "Non-stop laughs & absurd humor", icon: Laugh, gradient: "from-green-400 to-emerald-600" },
  { id: "dark", label: "Dark & Gritty", desc: "Horror, thriller & mature themes", icon: Ghost, gradient: "from-slate-500 to-gray-800" },
  { id: "epic", label: "Epic Adventure", desc: "Grand journeys & world-building", icon: Swords, gradient: "from-cyan-400 to-blue-600" },
  { id: "nostalgic", label: "Nostalgic", desc: "Classic anime that shaped the genre", icon: Compass, gradient: "from-teal-400 to-indigo-500" },
];

function MoodPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeMood, setActiveMood] = useState<string | null>(null);

  const handleMoodSelect = async (mood: typeof MOODS[0]) => {
    const isSameMood = selected === mood.id;
    const exclude = isSameMood
      ? [...results.map((r: any) => r.id), ...results.map((r: any) => r.title)]
      : [];

    setSelected(mood.id);
    setLoading(true);
    setResults([]);
    setActiveMood(mood.label);

    try {
      const data = await fetchMoodAnime(mood.label, exclude);
      setResults(data.results || []);
    } catch (err) {
      console.error("Mood fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const moodObj = MOODS.find((m) => m.id === selected);

  return (
    <div className="space-y-10">
      {/* Header */}
      <header className="text-center">
        <div className="relative mx-auto mb-6 inline-flex">
          <div className="absolute -inset-4 rounded-full bg-gradient-primary opacity-20 blur-2xl" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-primary shadow-glow animate-float">
            <Sparkles className="h-10 w-10 text-primary-foreground" />
          </div>
        </div>
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
          What's your <span className="text-gradient-primary">mood</span>?
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground leading-relaxed">
          Pick a vibe and our AI will curate the perfect anime lineup for you.
        </p>
      </header>

      {/* Mood Grid */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {MOODS.map((mood) => {
          const Icon = mood.icon;
          return (
            <button
              key={mood.id}
              onClick={() => handleMoodSelect(mood)}
              disabled={loading}
              className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-glow disabled:opacity-50 ${
                selected === mood.id
                  ? "border-primary bg-primary/10 shadow-glow"
                  : "border-white/5 glass hover:border-white/20"
              }`}
            >
              <Icon className={`h-8 w-8 transition-all duration-300 ${
                selected === mood.id ? "text-primary scale-110" : "text-white/40 group-hover:text-white group-hover:scale-110"
              }`} />
              <h3 className="mt-3 text-sm font-extrabold">{mood.label}</h3>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-success">AI Curated</p>
              {/* Subtle gradient glow on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${mood.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-[0.06] ${selected === mood.id ? "opacity-[0.08]" : ""}`} />
            </button>
          );
        })}
      </section>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
          <div className="relative">
            <div className="absolute -inset-6 rounded-full bg-gradient-primary opacity-20 blur-2xl animate-pulse" />
            <Loader2 className="relative h-12 w-12 animate-spin text-primary" />
          </div>
          <p className="mt-6 text-lg font-bold">
            Finding <span className="text-gradient-primary">{activeMood}</span> anime...
          </p>
          <p className="mt-1 text-xs text-muted-foreground">AI is analyzing thousands of titles for the perfect match</p>
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <section className="animate-fade-up">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black">
                <span className="text-gradient-primary">{activeMood}</span> picks
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">{results.length} AI-curated results</p>
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={() => {
                  const currentMood = MOODS.find((m) => m.id === selected);
                  if (currentMood) handleMoodSelect(currentMood);
                }}
                disabled={loading}
                className="flex items-center gap-2 rounded-full bg-gradient-primary px-4 py-2 text-xs font-extrabold text-primary-foreground shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-smooth disabled:opacity-50 disabled:hover:scale-100"
              >
                <Sparkles className="h-3.5 w-3.5" /> Get New Picks
              </button>
              <button
                onClick={() => { setSelected(null); setResults([]); setActiveMood(null); }}
                className="flex items-center gap-2 rounded-full glass-strong px-4 py-2 text-xs font-bold hover:bg-white/10 transition-smooth"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Pick another mood
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {results.map((anime: any) => (
              <Link
                key={anime.id}
                to="/anime/$id"
                params={{ id: anime.id }}
                className="group relative rounded-2xl border border-white/5 bg-card transition-all duration-300 hover:shadow-elevated hover:-translate-y-1"
              >
                <div className="aspect-[2/3] overflow-hidden rounded-t-2xl">
                  {anime.poster ? (
                    <img
                      src={anime.poster}
                      alt={anime.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-purple">
                      <Sparkles className="h-10 w-10 text-white/30" />
                    </div>
                  )}
                </div>

                {/* Rating badge */}
                {anime.rating && (
                  <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-yellow-400 backdrop-blur-md">
                    <Star className="h-3 w-3 fill-yellow-400" /> {(parseFloat(anime.rating) / 10).toFixed(1)}
                  </div>
                )}

                <div className="p-3">
                  <h3 className="line-clamp-1 text-xs font-bold group-hover:text-primary transition-colors">
                    {anime.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-muted-foreground italic">
                    "{anime.reason}"
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Empty results state */}
      {!loading && selected && results.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-center glass rounded-3xl animate-fade-in">
          <Sparkles className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-lg font-bold text-muted-foreground">No results found</p>
          <p className="mt-1 text-sm text-muted-foreground/60">Try picking a different mood!</p>
        </div>
      )}
    </div>
  );
}
