'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface PdfContextType {
  currentPdfName: string | null;
  setCurrentPdfName: (name: string | null) => void;
}

const PdfContext = createContext<PdfContextType | undefined>(undefined);

export function PdfProvider({ children }: { children: ReactNode }) {
  const [currentPdfName, setCurrentPdfName] = useState<string | null>(null);

  return (
    <PdfContext.Provider value={{ currentPdfName, setCurrentPdfName }}>
      {children}
    </PdfContext.Provider>
  );
}

export function usePdf() {
  const context = useContext(PdfContext);
  if (context === undefined) {
    throw new Error('usePdf must be used within a PdfProvider');
  }
  return context;
}