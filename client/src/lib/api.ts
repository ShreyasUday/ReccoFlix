import axios from "axios";
import type { Anime } from "./mock-anime";

export const getBaseURL = () => {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    const { hostname, origin, protocol, port } = window.location;
    const isLocalDevHost = hostname === "localhost" || hostname === "127.0.0.1";

    if (isLocalDevHost && port !== "3000") {
      return `${protocol}//${hostname}:3000/api`;
    }

    return `${origin}/api`;
  }

  return "http://localhost:3000/api";
};

export const getAuthURL = (path: string) => {
  const serverOrigin = getBaseURL().replace(/\/api$/, "");
  return `${serverOrigin}/auth/${path.replace(/^\/+/, "")}`;
};

export const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
});

export const formatKitsuToAnime = (item: any): Anime => {
  const attrs = item.attributes;
  return {
    id: String(item.id),
    title: attrs.canonicalTitle || attrs.titles?.en || attrs.titles?.en_jp || "Unknown Title",
    studio: attrs.studio || "Studio", 
    year: attrs.startDate ? new Date(attrs.startDate).getFullYear() : 2024,
    rating: attrs.averageRating ? parseFloat(attrs.averageRating) : 0,
    episodes: attrs.episodeCount || 0,
    status: attrs.status === "current" ? "ongoing" : attrs.status === "finished" ? "finished" : "upcoming",
    type: attrs.subtype || "tv",
    genres: attrs.genres || ["Anime"], 
    poster: attrs.posterImage?.original || attrs.posterImage?.large || "",
    banner: attrs.coverImage?.original || attrs.coverImage?.large || "",
    synopsis: attrs.description || attrs.synopsis || "No synopsis available.",
    ageRating: attrs.ageRating || "PG",
    ageRatingGuide: attrs.ageRatingGuide || "Teens 13 or older",
    matchPercent: Math.floor(Math.random() * 15) + 80,
    aiReason: attrs.aiReason || null,
  };
};

// ... existing fetch functions ...

export const fetchEpisodes = async (id: string, limit = 50, offset = 0): Promise<{ data: any[], total: number }> => {
  try {
    const res = await api.get(`/anime/episodes?id=${id}&limit=${limit}&offset=${offset}`);
    return {
      data: res.data.data,
      total: res.data.meta.count || 0
    };
  } catch (err) {
    console.error("Failed to fetch episodes:", err);
    return { data: [], total: 0 };
  }
};

export const fetchCharacters = async (id: string): Promise<any[]> => {
  try {
    const res = await api.get(`/anime/characters?id=${id}`);
    return res.data;
  } catch (err) {
    console.error("Failed to fetch characters:", err);
    return [];
  }
};

export const fetchTrending = async (): Promise<Anime[]> => {
  try {
    const res = await api.get("/anime/category");
    return res.data.trending.map(formatKitsuToAnime);
  } catch (err) {
    console.error("Failed to fetch trending:", err);
    return [];
  }
};

export const fetchOngoing = async (): Promise<Anime[]> => {
  try {
    const res = await api.get("/anime/ongoing");
    return res.data.map(formatKitsuToAnime);
  } catch (err) {
    console.error("Failed to fetch ongoing:", err);
    return [];
  }
};

export const fetchBrowse = async (category = "action", offset = 0, status = ""): Promise<{ items: Anime[], hasNextPage: boolean }> => {
  try {
    const res = await api.get(`/anime/browse?category=${category}&offset=${offset}&status=${status}`);
    return {
      items: res.data.items.map(formatKitsuToAnime),
      hasNextPage: res.data.hasNextPage
    };
  } catch (err) {
    console.error("Failed to fetch browse:", err);
    return { items: [], hasNextPage: false };
  }
};

export const loginUser = async (email: string, password: string) => {
  const res = await api.post("/auth/login", { email, password });
  return res.data;
};

export const registerUser = async (name: string, email: string, password: string) => {
  const res = await api.post("/auth/register", { name, email, password });
  return res.data;
};

export const fetchUser = async () => {
  const res = await api.get("/auth/me");
  return res.data;
};

export const logoutUser = async () => {
  const res = await api.get("/auth/logout");
  return res.data;
};

export const fetchProfile = async () => {
  const res = await api.get("/user/profile");
  return res.data;
};

export const fetchLibrary = async () => {
  const res = await api.get("/user/profile");
  return res.data.library || [];
};

export const addToLibrary = async (anime_id: string, anime_title: string, poster_image: string, status: string) => {
  const res = await api.post("/user/library/add", { anime_id, anime_title, poster_image, status });
  return res.data;
};

export const removeFromLibrary = async (anime_id: string) => {
  const res = await api.post("/user/library/remove", { anime_id });
  return res.data;
};

export const toggleFavorite = async (anime_id: string, anime_title?: string, poster_image?: string) => {
  const res = await api.post("/user/library/favorite", { anime_id, anime_title, poster_image });
  return res.data;
};

export const fetchShareLine = async (title: string, synopsis: string) => {
  const res = await api.post("/anime/share-line", { title, synopsis });
  return res.data.line;
};

export const updateProfile = async (data: { name?: string, email?: string, currentPassword?: string, newPassword?: string, avatar_url?: string | null, cover_url?: string | null }) => {
  const res = await api.post("/user/update-profile", data);
  return res.data;
};

export const forgotPassword = async (email: string) => {
  const res = await api.post("/auth/forgot-password", { email });
  return res.data;
};

export const resetPassword = async (token: string, password: string) => {
  const res = await api.post(`/auth/reset-password/${token}`, { password });
  return res.data;
};

export const fetchSearch = async (query: string): Promise<Anime[]> => {
  try {
    const res = await api.post("/anime/search", { search_data: query });
    return res.data.items.map(formatKitsuToAnime);
  } catch (err) {
    console.error("Failed to search:", err);
    return [];
  }
};
export const fetchAnimeDetails = async (idOrName: string): Promise<{ desc: Anime, related: Anime[], franchise: any[], userAnimeStatus: string | null }> => {
  try {
    const res = await api.get(`/anime/description?anime=${encodeURIComponent(idOrName)}`);
    return {
      desc: formatKitsuToAnime(res.data.desc),
      related: res.data.related.map(formatKitsuToAnime),
      franchise: res.data.franchise,
      userAnimeStatus: res.data.userAnimeStatus
    };
  } catch (err) {
    console.error("Failed to fetch anime details:", err);
    throw err;
  }
};
export const fetchEpisodeDetail = async (id: string, num: string): Promise<{ episode: any, anime: any }> => {
  const res = await api.get(`/anime/episode/${id}/${num}`);
  return res.data;
};
export const fetchRecommendations = async (): Promise<{ recommendations: Anime[], confidence: number, message: string }> => {
  try {
    const res = await api.get("/anime/recommendations");
    return {
      recommendations: res.data.recommendations.map(formatKitsuToAnime),
      confidence: res.data.confidence,
      message: res.data.message
    };
  } catch (err) {
    console.error("Failed to fetch recommendations:", err);
    return { recommendations: [], confidence: 0, message: "Standard Discovery" };
  }
};

export const fetchMoodAnime = async (mood: string) => {
  const res = await api.get(`/anime/mood?mood=${encodeURIComponent(mood)}`);
  return res.data;
};
