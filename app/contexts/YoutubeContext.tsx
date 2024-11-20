'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface YoutubeContextType {
  currentVideoId: string | null;
  setCurrentVideoId: (id: string | null) => void;
}

const YoutubeContext = createContext<YoutubeContextType | undefined>(undefined);

export function YoutubeProvider({ children }: { children: ReactNode }) {
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);

  return (
    <YoutubeContext.Provider value={{ currentVideoId, setCurrentVideoId }}>
      {children}
    </YoutubeContext.Provider>
  );
}

export function useYoutube() {
  const context = useContext(YoutubeContext);
  if (context === undefined) {
    throw new Error('useYoutube must be used within a YoutubeProvider');
  }
  return context;
}