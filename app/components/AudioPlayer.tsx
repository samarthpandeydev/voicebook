'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { FiPlay, FiPause, FiSkipBack, FiSkipForward } from 'react-icons/fi';
import VoiceSettings from './VoiceSettings';
import { useBrowserFeatures } from '../hooks/useBrowserFeatures';
import ClientLayout from './ClientLayout';

interface DialogueLine {
  speaker: 'alex' | 'sarah';
  text: string;
}

interface AudioPlayerProps {
  dialogueLines: DialogueLine[];
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
}

export default function AudioPlayer({ dialogueLines, isPlaying, setIsPlaying }: AudioPlayerProps) {
  // Refs first
  const playerRef = useRef<HTMLDivElement>(null);
  
  // Custom hooks
  const { synth, mounted } = useBrowserFeatures();
  
  // All useState hooks
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [selectedVoices, setSelectedVoices] = useState({
    alex: '',
    sarah: ''
  });

  // All useCallback hooks
  const handlePlayPause = useCallback(() => {
    if (!synth || !dialogueLines.length) return;
    
    if (isPlaying) {
      synth.cancel();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
    }
  }, [synth, dialogueLines.length, isPlaying, setIsPlaying]);

  const handleNavigate = useCallback((direction: 'next' | 'prev') => {
    if (!synth || !dialogueLines.length) return;

    synth.cancel();
    setIsPlaying(false);
    
    const newIndex = direction === 'next' 
      ? Math.min(dialogueLines.length - 1, currentIndex + 1)
      : Math.max(0, currentIndex - 1);
    
    setCurrentIndex(newIndex);
    
    setTimeout(() => {
      setIsPlaying(true);
    }, 100);
  }, [synth, currentIndex, dialogueLines.length, setIsPlaying]);

  const handleVoiceChange = useCallback((speaker: 'alex' | 'sarah', voiceName: string) => {
    setSelectedVoices(prev => ({
      ...prev,
      [speaker]: voiceName
    }));
    
    if (mounted) {
      localStorage.setItem(`voice-${speaker}`, voiceName);
    }
  }, [mounted]);

  // All useEffect hooks
  useEffect(() => {
    if (playerRef.current) {
      const element = playerRef.current;
      element.classList.remove('js-focus-visible');
      element.removeAttribute('data-js-focus-visible');
    }
  }, []);

  useEffect(() => {
    if (!mounted || !synth) return;

    const loadVoices = () => {
      const availableVoices = synth.getVoices();
      setVoices(availableVoices);
      
      if (availableVoices.length > 0) {
        const savedAlexVoice = localStorage.getItem('voice-alex') || availableVoices[0].name;
        const savedSarahVoice = localStorage.getItem('voice-sarah') || availableVoices[1]?.name || availableVoices[0].name;
        setSelectedVoices({
          alex: savedAlexVoice,
          sarah: savedSarahVoice
        });
      }
    };

    loadVoices();
    synth.addEventListener('voiceschanged', loadVoices);
    
    return () => {
      synth.removeEventListener('voiceschanged', loadVoices);
    };
  }, [synth, mounted]);

  useEffect(() => {
    if (!synth) return;

    const keepAliveInterval = setInterval(() => {
      if (synth.speaking && !synth.paused) {
        synth.pause();
        synth.resume();
      }
    }, 3000);

    return () => {
      clearInterval(keepAliveInterval);
      synth.cancel();
    };
  }, [synth]);

  useEffect(() => {
    if (!synth || !dialogueLines.length) return;
    let isMounted = true;

    if (isPlaying) {
      const currentLine = dialogueLines[currentIndex];
      if (!currentLine) return;

      const selectedVoice = voices.find(v => v.name === selectedVoices[currentLine.speaker]);
      if (!selectedVoice) return;

      const utterance = new SpeechSynthesisUtterance(currentLine.text);
      utterance.voice = selectedVoice;
      utterance.rate = 0.9;
      utterance.pitch = currentLine.speaker === 'alex' ? 1.0 : 1.1;
      utterance.volume = 1;

      utterance.onend = () => {
        if (!isMounted) return;
        
        if (currentIndex < dialogueLines.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
          setIsPlaying(false);
          setCurrentIndex(0);
        }
      };

      utterance.onerror = () => {
        if (!isMounted) return;
        setIsPlaying(false);
      };

      synth.speak(utterance);
    }

    return () => {
      isMounted = false;
      synth.cancel();
    };
  }, [isPlaying, currentIndex, dialogueLines, synth, voices, selectedVoices]);

  if (!mounted) return null;

  return (
    <ClientLayout>
      <div 
        ref={playerRef}
        className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-lg px-6 py-3 flex items-center gap-4 border border-gray-200 max-w-fit"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleNavigate('prev')}
            className="p-2 text-gray-600 hover:text-purple-600 rounded-full hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={currentIndex === 0 || isPlaying}
          >
            <FiSkipBack className="w-5 h-5" />
          </button>

          <button
            onClick={handlePlayPause}
            className="p-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {isPlaying ? (
              <FiPause className="w-5 h-5" />
            ) : (
              <FiPlay className="w-5 h-5" />
            )}
          </button>

          <button
            onClick={() => handleNavigate('next')}
            className="p-2 text-gray-600 hover:text-purple-600 rounded-full hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={currentIndex === dialogueLines.length - 1 || isPlaying}
          >
            <FiSkipForward className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-600">
            {currentIndex + 1} / {dialogueLines.length}
          </div>
          <VoiceSettings
            voices={voices}
            selectedVoices={selectedVoices}
            onVoiceChange={handleVoiceChange}
          />
        </div>
      </div>
    </ClientLayout>
  );
}