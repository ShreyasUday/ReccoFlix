import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchLibrary, toggleFavorite as apiToggleFavorite, addToLibrary, removeFromLibrary } from './api';
import { useAuth } from './auth-context';

interface LibraryContextType {
  library: any[];
  isLoading: boolean;
  isInLibrary: (id: string | number) => boolean;
  isFavorite: (id: string | number) => boolean;
  getAnimeStatus: (id: string | number) => string | null;
  refreshLibrary: () => Promise<void>;
  toggleFavorite: (anime: any) => Promise<void>;
  toggleLibrary: (anime: any) => Promise<void>;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [library, setLibrary] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  const refreshLibrary = useCallback(async () => {
    try {
      const data = await fetchLibrary();
      setLibrary(data);
    } catch (err) {
      setLibrary([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refreshLibrary();
    } else {
      setLibrary([]);
      setIsLoading(false);
    }
  }, [refreshLibrary, isAuthenticated]);

  const isInLibrary = useCallback((id: string | number) => {
    return library.some(item => String(item.anime_id) === String(id));
  }, [library]);

  const isFavorite = useCallback((id: string | number) => {
    const anime = library.find(item => String(item.anime_id) === String(id));
    return anime ? !!anime.is_favorite : false;
  }, [library]);

  const getAnimeStatus = useCallback((id: string | number) => {
    const anime = library.find(item => String(item.anime_id) === String(id));
    return anime ? anime.status : null;
  }, [library]);

  const toggleFavorite = useCallback(async (anime: any) => {
    await apiToggleFavorite(String(anime.id), anime.title, anime.poster);
    await refreshLibrary();
  }, [refreshLibrary]);

  const toggleLibrary = useCallback(async (anime: any) => {
    if (isInLibrary(anime.id)) {
      await removeFromLibrary(String(anime.id));
    } else {
      await addToLibrary(String(anime.id), anime.title, anime.poster, "planned");
    }
    await refreshLibrary();
  }, [isInLibrary, refreshLibrary]);

  return (
    <LibraryContext.Provider value={{ 
      library, 
      isLoading, 
      isInLibrary, 
      isFavorite, 
      getAnimeStatus, 
      refreshLibrary,
      toggleFavorite,
      toggleLibrary
    }}>
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (context === undefined) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
}
