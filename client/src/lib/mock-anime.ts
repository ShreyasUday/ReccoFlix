// Placeholder anime data. Replace with your backend calls.
export type AnimeStatus = "watching" | "completed" | "planned" | "on-hold" | "dropped" | "favorite";

export interface Anime {
  id: string;
  title: string;
  studio: string;
  year: number;
  rating: number; // 0-100
  episodes: number;
  status: "finished" | "ongoing" | "upcoming";
  type: "tv" | "movie" | "ova" | "special";
  genres: string[];
  poster: string;
  banner?: string;
  synopsis: string;
  matchPercent?: number;
  aiReason?: string | null;
  userStatus?: AnimeStatus;
  progress?: { current: number; total: number };
}

// Use picsum / placehold-style anime poster placeholders
// Aspect ratio 2:3 for posters
const poster = (seed: string) => `https://picsum.photos/seed/${seed}/600/900`;
const banner = (seed: string) => `https://picsum.photos/seed/${seed}-bg/1920/900`;

export const animeList: Anime[] = [
  {
    id: "1", title: "Demon Slayer: Mugen Train", studio: "ufotable", year: 2020,
    rating: 92, episodes: 1, status: "finished", type: "movie",
    genres: ["Action", "Supernatural", "Drama"],
    poster: poster("demon-slayer"), banner: banner("demon-slayer"),
    synopsis: "Tanjiro and his comrades board the Mugen Train to investigate a string of disappearances, unaware of the demonic horror that awaits them.",
    matchPercent: 97, userStatus: "watching", progress: { current: 1, total: 1 },
  },
  {
    id: "2", title: "Jujutsu Kaisen", studio: "MAPPA", year: 2020,
    rating: 89, episodes: 24, status: "ongoing", type: "tv",
    genres: ["Action", "Supernatural", "School"],
    poster: poster("jjk"), banner: banner("jjk"),
    synopsis: "Yuji Itadori swallows a cursed talisman and becomes the host of a powerful curse, forced to enter a world of sorcery to undo his fate.",
    matchPercent: 94, userStatus: "watching", progress: { current: 14, total: 24 },
  },
  {
    id: "3", title: "Attack on Titan: Final Season", studio: "MAPPA", year: 2022,
    rating: 95, episodes: 28, status: "finished", type: "tv",
    genres: ["Action", "Drama", "Fantasy"],
    poster: poster("aot"), banner: banner("aot"),
    synopsis: "The fate of humanity hangs in the balance as Eren's plan unfolds and the world prepares for its final reckoning.",
    matchPercent: 99, userStatus: "completed", progress: { current: 28, total: 28 },
  },
  {
    id: "4", title: "Frieren: Beyond Journey's End", studio: "Madhouse", year: 2023,
    rating: 96, episodes: 28, status: "finished", type: "tv",
    genres: ["Adventure", "Drama", "Fantasy"],
    poster: poster("frieren"), banner: banner("frieren"),
    synopsis: "An elf mage outlives her companions and sets out to understand humanity through a quiet, melancholic journey.",
    matchPercent: 98, userStatus: "favorite",
  },
  {
    id: "5", title: "Spy x Family", studio: "Wit Studio", year: 2022,
    rating: 87, episodes: 25, status: "ongoing", type: "tv",
    genres: ["Action", "Comedy", "Slice of Life"],
    poster: poster("spyfam"), banner: banner("spyfam"),
    synopsis: "A spy, an assassin, and a telepath form a fake family to maintain world peace—each unaware of the others' true identity.",
    matchPercent: 90, userStatus: "planned",
  },
  {
    id: "6", title: "Chainsaw Man", studio: "MAPPA", year: 2022,
    rating: 88, episodes: 12, status: "finished", type: "tv",
    genres: ["Action", "Horror", "Supernatural"],
    poster: poster("csm"), banner: banner("csm"),
    synopsis: "Denji merges with his pet devil Pochita and becomes Chainsaw Man, hunting devils for the Public Safety Bureau.",
    matchPercent: 91, userStatus: "completed",
  },
  {
    id: "7", title: "Vinland Saga", studio: "Wit Studio", year: 2019,
    rating: 90, episodes: 24, status: "finished", type: "tv",
    genres: ["Action", "Adventure", "Drama"],
    poster: poster("vinland"), banner: banner("vinland"),
    synopsis: "A young viking seeks revenge against the warrior who killed his father in a brutal coming-of-age epic.",
    matchPercent: 93,
  },
  {
    id: "8", title: "Mushoku Tensei", studio: "Studio Bind", year: 2021,
    rating: 86, episodes: 23, status: "ongoing", type: "tv",
    genres: ["Adventure", "Drama", "Fantasy"],
    poster: poster("mushoku"), banner: banner("mushoku"),
    synopsis: "Reborn into a world of magic with all his memories intact, a man vows to live this second life with no regrets.",
    matchPercent: 88,
  },
  {
    id: "9", title: "Bocchi the Rock!", studio: "CloverWorks", year: 2022,
    rating: 89, episodes: 12, status: "finished", type: "tv",
    genres: ["Comedy", "Music", "Slice of Life"],
    poster: poster("bocchi"), banner: banner("bocchi"),
    synopsis: "A painfully shy guitarist joins a rock band and discovers what it means to truly connect through music.",
    matchPercent: 85,
  },
  {
    id: "10", title: "Cyberpunk: Edgerunners", studio: "Trigger", year: 2022,
    rating: 91, episodes: 10, status: "finished", type: "tv",
    genres: ["Action", "Sci-Fi", "Drama"],
    poster: poster("edge"), banner: banner("edge"),
    synopsis: "A street kid in a tech-obsessed city becomes a mercenary outlaw — an edgerunner.",
    matchPercent: 92,
  },
  {
    id: "11", title: "Mob Psycho 100 III", studio: "Bones", year: 2022,
    rating: 92, episodes: 12, status: "finished", type: "tv",
    genres: ["Action", "Comedy", "Supernatural"],
    poster: poster("mob"), banner: banner("mob"),
    synopsis: "Mob faces his greatest internal battles as he learns what it means to grow up.",
    matchPercent: 94,
  },
  {
    id: "12", title: "Oshi no Ko", studio: "Doga Kobo", year: 2023,
    rating: 90, episodes: 11, status: "ongoing", type: "tv",
    genres: ["Drama", "Mystery", "Supernatural"],
    poster: poster("oshi"), banner: banner("oshi"),
    synopsis: "A doctor reincarnates as the son of his favorite idol, plunging into the dark side of the entertainment industry.",
    matchPercent: 89,
  },
];

export const featuredAnime = animeList[3]; // Frieren as hero

export const continueWatching = animeList.filter(a => a.userStatus === "watching");
export const trending = [...animeList].sort((a, b) => b.rating - a.rating).slice(0, 10);
export const recommended = animeList.filter(a => (a.matchPercent ?? 0) >= 90);
export const popularMovies = animeList.filter(a => a.type === "movie");

export const genres = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror",
  "Mystery", "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural",
  "Thriller", "Music", "Historical", "School",
];

export const genreIcons: Record<string, string> = {
  Action: "⚔️", Adventure: "🧭", Comedy: "😄", Drama: "🎭",
  Fantasy: "🐉", Horror: "👻", Mystery: "🔍", Romance: "💖",
  "Sci-Fi": "🚀", "Slice of Life": "🍵", Sports: "⚽", Supernatural: "🔮",
  Thriller: "😱", Music: "🎵", Historical: "📜", School: "🎒",
};

export function getAnimeById(id: string): Anime | undefined {
  return animeList.find(a => a.id === id);
}

export function getRelated(id: string): Anime[] {
  const a = getAnimeById(id);
  if (!a) return [];
  return animeList.filter(x => x.id !== id && x.genres.some(g => a.genres.includes(g))).slice(0, 8);
}
