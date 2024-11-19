'use client';

import { useEffect, useState } from 'react';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const html = document.documentElement;
    if (html.classList.contains('js-focus-visible')) {
      html.classList.remove('js-focus-visible');
    }
    if (html.hasAttribute('data-js-focus-visible')) {
      html.removeAttribute('data-js-focus-visible');
    }
  }, [mounted]);

  if (!mounted) return null;

  return <>{children}</>;
}