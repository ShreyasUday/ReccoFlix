import { 
  getAIRecommendations, 
  fetchKitsuDetailsByTitle, 
  generateShareLine, 
  generateAISynopsis,
  getMoodRecommendations,
  generateEpisodeAISynopsis,
  getTrendingRecommendations
} from "../services/ai/index.js";
import { prisma } from "../config/database.js";
import axios from "axios";

function extractFranchiseKeyword(animeData) {
  return animeData.attributes.canonicalTitle.split(/[(:]/)[0].trim();
}

function dedupeAnime(items) {
  const seen = new Set();
  return items.filter((item) => {
    const title = item?.attributes?.canonicalTitle?.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!title || seen.has(title)) return false;
    seen.add(title);
    return true;
  });
}

export const getCategory = async (req, res) => {
  try {
    const axiosConfig = { timeout: 8000 };

    const [kitsuCurrent, kitsuPopular, jikanSeason] = await Promise.allSettled([
      axios.get("https://kitsu.io/api/edge/anime?filter[status]=current&sort=-userCount&page[limit]=20", axiosConfig),
      axios.get("https://kitsu.io/api/edge/anime?sort=-userCount&page[limit]=20", axiosConfig),
      axios.get("https://api.jikan.moe/v4/seasons/now?limit=20&sfw=true", axiosConfig)
    ]);

    const currentItems = kitsuCurrent.status === "fulfilled" ? kitsuCurrent.value.data.data : [];
    const popularItems = kitsuPopular.status === "fulfilled" ? kitsuPopular.value.data.data : [];
    const jikanSignals = jikanSeason.status === "fulfilled"
      ? jikanSeason.value.data.data.map((item) => item.title_english || item.title).filter(Boolean)
      : [];

    const signals = dedupeAnime([...currentItems, ...popularItems])
      .slice(0, 24)
      .map((item) => item.attributes.canonicalTitle)
      .concat(jikanSignals.slice(0, 12));

    const aiPicks = await getTrendingRecommendations(signals);
    const aiItems = await Promise.all(
      aiPicks.map(async (pick) => {
        const details = await fetchKitsuDetailsByTitle(pick.title);
        if (details) {
          details.attributes.aiReason = pick.reason;
          return details;
        }
        return null;
      })
    );

    const trending = dedupeAnime([
      ...aiItems.filter(Boolean),
      ...currentItems,
      ...popularItems
    ]).slice(0, 20);

    res.json({ trending });
  } catch (err) {
    console.log("Category page error:", err.message);
    res.status(500).json({ error: "Failed to fetch trending anime" });
  }
};

export const postSearch = async (req, res) => {
  const request = req.body.search_data || req.query.q;

  try {
    const response = await axios.get(
      `https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(request)}`
    );
    const items = response.data.data;
    res.json({ items });
  } catch (err) {
    console.log("Search error:", err.message);
    res.status(500).json({ error: "Search failed" });
  }
};

export const getBrowse = async (req, res) => {
  const selectedCategory = req.query.category || "action";
  const status = req.query.status || ""; // 'current', 'finished', 'upcoming'
  const offset = parseInt(req.query.offset) || 0;
  const limit = 20;

  try {
    const categoryMap = {
      "scifi": "sci-fi",
      "slice of life": "slice-of-life",
      "science-fiction": "sci-fi"
    };

    const apiCategory = categoryMap[selectedCategory] || selectedCategory.replace(/ /g, '-');
    
    // Diversity Logic: Randomly pick a sort order if not strictly searching for trending/hot
    const sorts = ["-userCount", "-averageRating", "-favoritesCount", "-startDate"];
    const randomSort = sorts[Math.floor(Math.random() * sorts.length)];
    const finalSort = (selectedCategory === "trending" || status === "current") ? "popularityRank" : randomSort;

    // Build URL with filters FIRST, then pagination
    let kitsuUrl = `https://kitsu.io/api/edge/anime?`;
    
    const filters = [];
    if (apiCategory && apiCategory !== "trending" && apiCategory !== "all") {
      filters.push(`filter[categories]=${encodeURIComponent(apiCategory)}`);
    }
    if (status) {
      filters.push(`filter[status]=${status}`);
    }
    
    kitsuUrl += filters.join("&");
    if (filters.length > 0) kitsuUrl += "&";
    
    kitsuUrl += `page[limit]=${limit}&page[offset]=${offset}&sort=${finalSort}`;

    const response = await axios.get(kitsuUrl);
    let items = response.data.data;
    
    // Inject AI Curation for Trending Page
    if (selectedCategory === "trending" && offset === 0) {
      try {
        const signals = items.map(item => item.attributes.canonicalTitle).slice(0, 24);
        const aiPicks = await getTrendingRecommendations(signals);
        
        const aiItems = await Promise.all(
          aiPicks.map(async (pick) => {
            const details = await fetchKitsuDetailsByTitle(pick.title);
            if (details) {
              details.attributes.aiReason = pick.reason;
              return details;
            }
            return null;
          })
        );
        
        items = dedupeAnime([...aiItems.filter(Boolean), ...items]).slice(0, 20);
      } catch (aiErr) {
        console.warn("Browse AI Trending fallback:", aiErr.message);
      }
    } else if (selectedCategory !== "trending" && status !== "current") {
      // Only shuffle if it's not a strict "Trending" or "Live" request
      items = items.sort(() => Math.random() - 0.5);
    }
    
    const totalCount = response.data.meta ? response.data.meta.count : items.length;
    const hasNextPage = offset + limit < totalCount;

    res.json({
      items,
      category: selectedCategory,
      currentOffset: offset,
      nextOffset: offset + limit,
      prevOffset: Math.max(0, offset - limit),
      hasNextPage 
    });
  } catch (err) {
    console.log("Browse error:", err.message);
    res.status(500).json({ error: "Failed to fetch browse data" });
  }
};

export const getDescription = async (req, res) => {
  const animeQuery = req.query.anime;
  console.log(`[GET_DESCRIPTION] Request for: ${animeQuery}`);

  try {
    let animeData;
    const axiosConfig = { timeout: 8000 }; // 8s timeout for stability
    
    if (/^\d+$/.test(animeQuery)) {
      const response = await axios.get(`https://kitsu.io/api/edge/anime/${animeQuery}`, axiosConfig);
      animeData = response.data.data;
    } else {
      const response = await axios.get(
        `https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(animeQuery)}&page[limit]=5`,
        axiosConfig
      );
      const results = response.data.data;
      if (!results || results.length === 0) return res.status(404).json({ error: "Anime not found" });
      animeData = results.find(item =>
        item.attributes.canonicalTitle.toLowerCase() === animeQuery.toLowerCase() ||
        (item.attributes.titles.en && item.attributes.titles.en.toLowerCase() === animeQuery.toLowerCase())
      ) || results[0];
    }

    if (!animeData) {
      console.log(`[GET_DESCRIPTION] Anime NOT found: ${animeQuery}`);
      return res.status(404).json({ error: "Anime not found" });
    }

    // AI Synopsis Generation: If kitsu data is thin, let AI write a masterpiece
    // Wrap in a separate block to ensure it doesn't kill the main response
    const currentSynopsis = animeData.attributes.synopsis || "";
    if (currentSynopsis.length < 150) {
      try {
        console.log(`[GET_DESCRIPTION] Triggering AI Synopsis for: ${animeData.attributes.canonicalTitle}`);
        // We set a shorter timeout for AI to not block the user too long
        const aiSynopsis = await generateAISynopsis(animeData.attributes.canonicalTitle, animeData);
        if (aiSynopsis) {
          animeData.attributes.synopsis = aiSynopsis; // Directly overwrite the short one
        }
      } catch (aiErr) {
        console.warn(`[GET_DESCRIPTION] AI Synopsis failed (ignoring):`, aiErr.message);
      }
    }

    // Fetch deep details: Genres, Studio, Relationships
    console.log(`[GET_DESCRIPTION] Fetching secondary metadata for ID: ${animeData.id}`);
    const [categoriesRes, productionsRes, mediaRelRes] = await Promise.allSettled([
      axios.get(`https://kitsu.io/api/edge/anime/${animeData.id}/categories?page[limit]=15&sort=-totalMediaCount`, axiosConfig),
      axios.get(`https://kitsu.io/api/edge/anime/${animeData.id}/productions?include=company&page[limit]=10`, axiosConfig),
      axios.get(`https://kitsu.io/api/edge/anime/${animeData.id}/media-relationships?include=destination&page[limit]=20`, axiosConfig)
    ]);

    // Extract Genres
    const categories = categoriesRes.status === 'fulfilled' ? categoriesRes.value.data.data : [];
    animeData.attributes.genres = categories.slice(0, 5).map(c => c.attributes.title);

    // Extract Studio
    const productions = productionsRes.status === 'fulfilled' ? productionsRes.value.data.included : [];
    let studio = productions?.find(item => item.type === 'companies')?.attributes?.name || "Unknown Studio";
    
    // Cross-reference Jikan (MAL) for missing Studio or Episode Count
    let episodeCount = animeData.attributes.episodeCount || 0;

    let episodeLength = animeData.attributes.episodeLength || 0;

    if (studio === "Unknown Studio" || episodeCount === 0 || episodeLength === 0) {
      try {
        console.log(`[GET_DESCRIPTION] Attempting Jikan fallback for Studio/Episodes/Runtime...`);
        const mappingUrl = `https://kitsu.io/api/edge/anime/${animeData.id}/mappings`;
        const mappingResp = await axios.get(mappingUrl, { timeout: 5000 });
        const malMapping = mappingResp.data.data.find(m => m.attributes.externalSite === "myanimelist/anime");
        
        if (malMapping) {
          const malId = malMapping.attributes.externalId;
          const jikanUrl = `https://api.jikan.moe/v4/anime/${malId}`;
          const jikanResp = await axios.get(jikanUrl, { timeout: 8000 });
          
          if (jikanResp.data.data) {
            const malData = jikanResp.data.data;
            if (studio === "Unknown Studio" && malData.studios?.length > 0) {
              studio = malData.studios[0].name;
            }
            if (episodeCount === 0 && malData.episodes) {
              episodeCount = malData.episodes;
            }
            if (episodeLength === 0 && malData.duration) {
              // Duration is usually "24 min per ep" or "1 hr 45 min"
              const match = malData.duration.match(/(\d+)\s+min/);
              if (match) episodeLength = parseInt(match[1]);
            }
          }
        }
      } catch (malErr) {
        console.warn(`[GET_DESCRIPTION] Jikan detail fallback failed:`, malErr.message);
      }
    }

    animeData.attributes.studio = studio;
    animeData.attributes.episodeCount = episodeCount;
    animeData.attributes.episodeLength = episodeLength;

    const canonical = animeData.attributes.canonicalTitle.toLowerCase();
    const mediaRels = mediaRelRes.status === 'fulfilled' ? (mediaRelRes.value.data.included || []) : [];
    const franchise = mediaRels.filter(item => item.type === 'anime' && item.attributes.canonicalTitle.toLowerCase() !== canonical);

    // Related logic based on genres
    let related = [];
    if (categories.length > 0) {
      const targetTags = categories.slice(0, 3).map(c => c.attributes.slug);
      const relRes = await axios.get(`https://kitsu.io/api/edge/anime?filter[categories]=${targetTags.join(',')}&sort=-userCount&page[limit]=12`).catch(() => ({ data: { data: [] } }));
      related = relRes.data.data.filter(item => item.attributes.canonicalTitle.toLowerCase() !== canonical);
    }

    let userAnimeStatus = null;
    if (req.isAuthenticated()) {
      const check = await prisma.userLibrary.findFirst({ where: { user_id: req.user.id, anime_id: String(animeData.id) } });
      if (check) userAnimeStatus = check.status;
    }

    res.json({ desc: animeData, franchise, related, userAnimeStatus });
  } catch (err) {
    console.error("Description error:", err.message);
    res.status(500).json({ error: "Failed to fetch anime description" });
  }
};

export const getEpisodes = async (req, res) => {
  const { id, limit = 50, offset = 0 } = req.query;
  const numericLimit = parseInt(limit);
  const numericOffset = parseInt(offset);
  
  console.log(`[GET_EPISODES] ID: ${id}, Limit: ${numericLimit}, Offset: ${numericOffset}`);
  
  try {
    // 1. Get Kitsu Episodes (Multi-fetch needed because Kitsu limit is 20)
    const kitsuLimit = 20;
    const requestsNeeded = Math.ceil(numericLimit / kitsuLimit);
    const kitsuRequests = [];

    for (let i = 0; i < requestsNeeded; i++) {
      const currentOffset = numericOffset + (i * kitsuLimit);
      const kitsuUrl = `https://kitsu.io/api/edge/anime/${id}/episodes?page[limit]=${kitsuLimit}&page[offset]=${currentOffset}`;
      kitsuRequests.push(axios.get(kitsuUrl, { timeout: 8000 }));
    }

    const kitsuResponses = await Promise.all(kitsuRequests);
    
    let allEpisodes = [];
    let totalCount = 0;
    
    kitsuResponses.forEach(resp => {
      allEpisodes = [...allEpisodes, ...resp.data.data];
      totalCount = resp.data.meta.count || totalCount;
    });

    // Fetch Anime Status to help with unreleased episode detection
    let animeStatus = "tba";
    let animeEpisodeCount = null;
    try {
      const animeResp = await axios.get(`https://kitsu.io/api/edge/anime/${id}`, { timeout: 5000 });
      animeStatus = animeResp.data.data.attributes.status;
      animeEpisodeCount = animeResp.data.data.attributes.episodeCount;
    } catch (e) {
      console.warn(`[GET_EPISODES] Failed to fetch anime status:`, e.message);
    }

    // 2. Fetch Deep Metadata (Ratings/Runtime) from Jikan fallback
    try {
      const mappingUrl = `https://kitsu.io/api/edge/anime/${id}/mappings`;
      const mappingResp = await axios.get(mappingUrl, { timeout: 5000 });
      const malMapping = mappingResp.data.data.find(m => m.attributes.externalSite === "myanimelist/anime");
      
      if (malMapping) {
        const malId = malMapping.attributes.externalId;
        
        const firstEpNum = numericOffset + 1;
        const lastEpNum = numericOffset + numericLimit;
        const startJikanPage = Math.ceil(firstEpNum / 100);
        const endJikanPage = Math.ceil(lastEpNum / 100);
        
        const jikanReqs = [];
        for (let p = startJikanPage; p <= endJikanPage; p++) {
          jikanReqs.push(axios.get(`https://api.jikan.moe/v4/anime/${malId}/episodes?page=${p}`, { timeout: 8000 }));
        }

        const [videosResp, ...jikanResps] = await Promise.allSettled([
          axios.get(`https://api.jikan.moe/v4/anime/${malId}/videos`, { timeout: 8000 }),
          ...jikanReqs
        ]);

        const jikanVideos = videosResp.status === 'fulfilled' ? videosResp.value.data.data?.episodes : [];
        
        let jikanDetails = [];
        let jikanSuccess = false;

        jikanResps.forEach(r => {
          if (r.status === 'fulfilled') {
            jikanDetails = [...jikanDetails, ...r.value.data.data];
            jikanSuccess = true;
          } else if (r.reason?.response?.status === 404) {
            // 404 means page doesn't exist, which implies we are beyond the released episodes. Valid response!
            jikanSuccess = true;
          }
        });

        // Merge deep metadata into Kitsu episodes
        allEpisodes = allEpisodes.map(ep => {
          const epNum = parseInt(ep.attributes.number);
          
          if (!ep.attributes.thumbnail) {
            const videoMatch = jikanVideos?.find(v => v.mal_id === epNum);
            if (videoMatch?.images?.jpg?.image_url) {
              ep.attributes.thumbnail = { original: videoMatch.images.jpg.image_url };
            }
          }

          const detailMatch = jikanDetails?.find(d => d.mal_id === epNum);
          if (detailMatch) {
            const airdate = ep.attributes.airdate ? new Date(ep.attributes.airdate) : null;
            const isTooRecent = airdate && airdate > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            
            // Jikan episode scores are often based on 5-star polls, so we normalize to 10
            // If the episode is very recent, the rating is often inaccurate due to low votes.
            ep.attributes.rating = (detailMatch.score && !isTooRecent && detailMatch.score >= 1) 
              ? (detailMatch.score * 2).toFixed(1) 
              : null;
            ep.attributes.isFiller = detailMatch.filler;
            ep.attributes.isRecap = detailMatch.recap;
          }

          return ep;
        });
      }
    } catch (fallbackErr) {
      console.warn(`[GET_EPISODES] Metadata enrichment fallback failed:`, fallbackErr.message);
    }

    // Filter out unreleased episodes and dynamically adjust totalCount
    const now = new Date();
    let encounteredFuture = false;
    let maxReleasedNum = 0;

    // Find the highest explicitly released episode number in this chunk
    allEpisodes.forEach(ep => {
      if (ep.attributes.airdate && new Date(ep.attributes.airdate) <= now) {
        const num = parseInt(ep.attributes.number);
        if (num > maxReleasedNum) maxReleasedNum = num;
      }
    });
    
    allEpisodes = allEpisodes.filter(ep => {
      const num = parseInt(ep.attributes.number);
      let isReleased = true;

      // Ensure we have access to Jikan fallback variables
      const malId = typeof jikanDetails !== 'undefined'; // Just checking if we entered the block

      // Prioritize Jikan's exact data if the API request was successful
      if (typeof jikanSuccess !== 'undefined' && jikanSuccess) {
        const detailMatch = jikanDetails.find(d => d.mal_id === num);
        if (detailMatch) {
          ep.attributes.airdate = detailMatch.aired; // Override Kitsu's airdate
          isReleased = detailMatch.aired ? new Date(detailMatch.aired) <= now : false;
        } else {
          // If Jikan succeeded but this episode is completely missing from Jikan, it is an unreleased Kitsu placeholder!
          isReleased = false;
        }
      } else {
        // Fallback to Kitsu heuristics if Jikan completely timed out
        if (ep.attributes.airdate) {
          isReleased = new Date(ep.attributes.airdate) <= now;
        } else {
          if (animeEpisodeCount === null) {
            isReleased = true;
          } else if (animeStatus === "current" || animeStatus === "upcoming") {
            isReleased = maxReleasedNum > 0 && num <= maxReleasedNum;
            if (!isReleased && (ep.attributes.thumbnail || ep.attributes.synopsis)) {
              isReleased = true;
            }
          } else {
            isReleased = true; 
          }
        }
      }

      if (!isReleased) encounteredFuture = true;
      return isReleased;
    });

    if (encounteredFuture) {
      totalCount = numericOffset + allEpisodes.length;
    }

    res.json({
      data: allEpisodes.slice(0, numericLimit),
      meta: { count: totalCount || allEpisodes.length }
    });
  } catch (err) {
    console.error(`[GET_EPISODES] Error:`, err.response?.status || err.message);
    res.status(500).json({ error: "Failed to fetch episodes" });
  }
};

export const getCharacters = async (req, res) => {
  const { id } = req.query;
  console.log(`[GET_CHARACTERS] ID: ${id}`);
  try {
    const response = await axios.get(`https://kitsu.io/api/edge/anime/${id}/anime-characters?include=character&page[limit]=30`, { timeout: 8000 });
    const characters = (response.data.included || []).filter(item => item.type === 'characters');
    console.log(`[GET_CHARACTERS] Found: ${characters.length} characters`);
    res.json(characters);
  } catch (err) {
    console.error(`[GET_CHARACTERS] Error:`, err.message);
    res.status(500).json({ error: "Failed to fetch characters" });
  }
};
export const getOngoing = async (req, res) => {
  try {
    // Simplify query to avoid 400 error while still getting 'hyped' new shows
    // We sort by userCount (popularity) but ensure they are 'current'
    const kitsuUrl = `https://kitsu.io/api/edge/anime?filter[status]=current&sort=-userCount&page[limit]=15`;
    const response = await axios.get(kitsuUrl, { timeout: 8000 });
    
    // Filter locally to ensure we don't show ancient shows like Doraemon if needed
    // or just trust the 'current' status for now. 
    // To be safe, we'll just use the popularity sort.
    const items = response.data.data.sort(() => Math.random() - 0.5);
    res.json(items);
  } catch (err) {
    console.error("Ongoing error:", err.message);
    res.status(500).json({ error: "Failed to fetch ongoing anime" });
  }
};

export const getRecommendations = async (req, res) => {
  try {
    let source = "trending";
    let recResults = [];
    let confidence = 0;
    let message = "";

    if (req.isAuthenticated()) {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          ai_recommendations: true,
          last_ai_calculation: true,
          ai_confidence_cache: true,
          ai_message_cache: true,
          needs_ai_refresh: true
        }
      });

      const hasCache = user.ai_recommendations && Array.isArray(user.ai_recommendations) && user.ai_recommendations.length > 0;
      const shouldRefresh = user.needs_ai_refresh || !hasCache;

      if (!shouldRefresh && hasCache) {
        recResults = user.ai_recommendations;
        confidence = user.ai_confidence_cache;
        message = user.ai_message_cache;
        source = "ai";
      } else {
        const userLibrary = await prisma.userLibrary.findMany({
          where: { user_id: req.user.id },
          take: 15,
          orderBy: { created_at: "desc" }
        });

        if (userLibrary.length > 0) {
          const userAnimeTitles = userLibrary.map(a => a.anime_title);
          const aiResult = await getAIRecommendations(userAnimeTitles, ["Action", "Adventure", "Fantasy"]);
          
          if (aiResult && aiResult.recommendations && aiResult.recommendations.length > 0) {
            const detailPromises = aiResult.recommendations.map(async (rec) => {
              const details = await fetchKitsuDetailsByTitle(rec.title);
              if (details) {
                details.attributes.aiReason = rec.reason;
                return details;
              }
              return null;
            });
            const results = await Promise.all(detailPromises);
            recResults = results.filter(r => r !== null);
            confidence = aiResult.confidence;
            message = aiResult.message;
            source = "ai";

            await prisma.user.update({
              where: { id: req.user.id },
              data: {
                ai_recommendations: recResults,
                ai_confidence_cache: confidence,
                ai_message_cache: message,
                last_ai_calculation: new Date(),
                needs_ai_refresh: false
              }
            });
          }
        }
      }
    }

    if (source === "trending") {
      const kitsuUrl = `https://kitsu.io/api/edge/anime?sort=-userCount&page[limit]=20`;
      const response = await axios.get(kitsuUrl, { timeout: 8000 });
      recResults = response.data.data;
      
      if (req.isAuthenticated()) {
        const libCount = await prisma.userLibrary.count({ where: { user_id: req.user.id } });
        if (libCount > 0) {
          confidence = Math.min(65 + (libCount * 2), 95);
          message = "Discovery Mode";
        } else {
          confidence = 0;
          message = "Global Trending";
        }
      } else {
        confidence = 0;
        message = "Global Trending";
      }
    }

    res.json({ recommendations: recResults, source, confidence, message });
  } catch (err) {
    console.error("Recommendations error:", err.message);
    res.status(500).json({ error: "Failed to fetch recommendations" });
  }
};

export const getShareLine = async (req, res) => {
  const { title, synopsis } = req.body;
  if (!title || !synopsis) return res.status(400).json({ error: "Title and synopsis required" });

  try {
    const line = await generateShareLine(title, synopsis);
    res.json({ line });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate share line" });
  }
};

export const getMoodAnime = async (req, res) => {
  const { mood, exclude } = req.query;
  if (!mood) return res.status(400).json({ error: "Mood is required" });

  try {
    let excludeList = [];
    if (exclude) {
      excludeList = typeof exclude === 'string'
        ? exclude.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
        : Array.isArray(exclude) ? exclude.map(s => String(s).trim().toLowerCase()).filter(Boolean) : [];
    }

    const picks = await getMoodRecommendations(mood, excludeList);

    const enriched = [];
    const seenIds = new Set();
    const seenTitles = new Set();

    for (const pick of picks) {
      if (enriched.length >= 10) break;

      const pickTitleLower = pick.title.toLowerCase();
      if (excludeList.includes(pickTitleLower)) continue;
      if (seenTitles.has(pickTitleLower)) continue;

      const kitsuData = await fetchKitsuDetailsByTitle(pick.title);
      if (kitsuData) {
        const id = kitsuData.id;
        const attr = kitsuData.attributes;
        const canonicalTitle = attr.canonicalTitle || pick.title;
        const canonicalTitleLower = canonicalTitle.toLowerCase();

        // Exclude by Kitsu ID or Canonical Title matches
        if (excludeList.includes(id.toLowerCase())) continue;
        if (excludeList.includes(canonicalTitleLower)) continue;

        // Deduplicate within the current response batch
        if (seenIds.has(id)) continue;
        if (seenTitles.has(canonicalTitleLower)) continue;

        seenIds.add(id);
        seenTitles.add(canonicalTitleLower);
        seenTitles.add(pickTitleLower);

        enriched.push({
          id,
          title: canonicalTitle,
          poster: attr.posterImage?.large || attr.posterImage?.medium || null,
          cover: attr.coverImage?.original || attr.coverImage?.large || null,
          rating: attr.averageRating || null,
          synopsis: attr.synopsis?.substring(0, 200) || "",
          reason: pick.reason,
        });
      }
    }

    res.json({ mood, results: enriched });
  } catch (err) {
    console.error("❌ Mood anime error:", err.message);
    res.status(500).json({ error: "Failed to get mood-based anime" });
  }
};

export const getEpisodeDetail = async (req, res) => {
  const { id, num } = req.params;
  console.log(`[GET_EPISODE_DETAIL] Anime: ${id}, Ep: ${num}`);

  try {
    // 1. Fetch Episode + Anime Context from Kitsu
    const kitsuUrl = `https://kitsu.io/api/edge/episodes?filter[mediaId]=${id}&filter[mediaType]=Anime&filter[number]=${num}`;
    const [kitsuResp, animeResp] = await Promise.all([
      axios.get(kitsuUrl, { timeout: 8000 }),
      axios.get(`https://kitsu.io/api/edge/anime/${id}`, { timeout: 8000 })
    ]);

    const epData = kitsuResp.data.data[0];
    const animeData = animeResp.data.data;

    if (!epData) {
      console.warn(`[GET_EPISODE_DETAIL] 404: Episode record not found for Anime ${id}, Ep ${num}`);
      return res.status(404).json({ error: "Episode record not found" });
    }

    console.log(`[GET_EPISODE_DETAIL] Found Episode: ${epData.id}`);

    // 2. Fetch Deep Metadata (Rating/Airdate) from Jikan
    try {
      const mappingUrl = `https://kitsu.io/api/edge/anime/${id}/mappings`;
      const mappingResp = await axios.get(mappingUrl, { timeout: 5000 });
      const malMapping = mappingResp.data.data.find(m => m.attributes.externalSite === "myanimelist/anime");

      if (malMapping) {
        const malId = malMapping.attributes.externalId;
        const jikanEpResp = await axios.get(`https://api.jikan.moe/v4/anime/${malId}/episodes/${num}`, { timeout: 8000 });
        const detailMatch = jikanEpResp.data.data;

        if (detailMatch) {
          const airdate = detailMatch.aired ? new Date(detailMatch.aired) : null;
          const isTooRecent = airdate && airdate > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

          epData.attributes.rating = (detailMatch.score && !isTooRecent && detailMatch.score >= 1) 
            ? (detailMatch.score * 2).toFixed(1) 
            : null;
          epData.attributes.airdate = detailMatch.aired;
          epData.attributes.isFiller = detailMatch.filler;
        }
      }
    } catch (fallbackErr) {
      console.warn(`[GET_EPISODE_DETAIL] Jikan fallback failed:`, fallbackErr.message);
    }

    // 3. Narrative Synthesis (AI Enrichment)
    const currentSynopsis = epData.attributes.synopsis || "";
    try {
      console.log(`[GET_EPISODE_DETAIL] Triggering AI Narrative for Ep ${num}...`);
      
      const aiDossier = await Promise.race([
        generateEpisodeAISynopsis(
          animeData.attributes.canonicalTitle, 
          num, 
          epData.attributes.canonicalTitle, 
          animeData.attributes.synopsis, 
          currentSynopsis
        ),
        new Promise((_, reject) => setTimeout(() => reject(new Error("AI Timeout")), 8000))
      ]);

      if (aiDossier) {
        console.log(`[GET_EPISODE_DETAIL] AI Narrative successfully generated`);
        if (aiDossier.synopsis && (!currentSynopsis || currentSynopsis.length < 100)) {
          epData.attributes.synopsis = aiDossier.synopsis;
        }
        if (!epData.attributes.rating && aiDossier.rating) {
          epData.attributes.rating = parseFloat(aiDossier.rating).toFixed(1);
        }
        if ((!epData.attributes.length || epData.attributes.length === 0) && aiDossier.length) {
          epData.attributes.length = parseInt(aiDossier.length);
        }
        epData.attributes.archivistNote = aiDossier.archivistNote;
      }
    } catch (aiErr) {
      console.warn(`[GET_EPISODE_DETAIL] AI Narrative skipped/failed:`, aiErr.message);
    }

    console.log(`[GET_EPISODE_DETAIL] Finalizing response for Anime ${id}, Ep ${num}`);
    res.json({
      episode: epData,
      anime: animeData
    });
  } catch (err) {
    console.error(`[GET_EPISODE_DETAIL] Error:`, err.message);
    res.status(500).json({ error: "Failed to assemble narrative dossier" });
  }
};
