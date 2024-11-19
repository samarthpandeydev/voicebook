import { useState, useEffect } from 'react';

export function useBrowserFeatures() {
  const [state, setState] = useState({
    synth: null as SpeechSynthesis | null,
    recognition: null as any,
    mounted: false
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    setState({
      synth: window.speechSynthesis,
      recognition: ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) 
        ? new (window.SpeechRecognition || window.webkitSpeechRecognition)() 
        : null,
      mounted: true
    });
  }, []);

  return state;
}