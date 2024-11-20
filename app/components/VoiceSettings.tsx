import { useState } from 'react';
import { FiSettings, FiX } from 'react-icons/fi';

interface VoiceSettingsProps {
  voices: SpeechSynthesisVoice[];
  selectedVoices: {
    alex: string;
    sarah: string;
  };
  onVoiceChange: (speaker: 'alex' | 'sarah', voiceName: string) => void;
}

export default function VoiceSettings({ voices, selectedVoices, onVoiceChange }: VoiceSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Group voices by language
  const groupedVoices = voices.reduce((acc, voice) => {
    const lang = voice.lang;
    if (!acc[lang]) {
      acc[lang] = [];
    }
    acc[lang].push(voice);
    return acc;
  }, {} as Record<string, SpeechSynthesisVoice[]>);

  // Sort languages alphabetically
  const sortedLanguages = Object.keys(groupedVoices).sort();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-purple-600 hover:text-purple-800 rounded-full hover:bg-purple-100"
        title="Voice Settings"
      >
        <FiSettings className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-96 max-h-[80vh] overflow-y-auto bg-white rounded-lg shadow-xl border border-purple-100 p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-gray-800">Voice Settings</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {['alex', 'sarah'].map((speaker) => (
              <div key={speaker}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {speaker === 'alex' ? "Alex's" : "Sarah's"} Voice
                </label>
                <select
                  value={selectedVoices[speaker as keyof typeof selectedVoices]}
                  onChange={(e) => onVoiceChange(speaker as 'alex' | 'sarah', e.target.value)}
                  className="w-full rounded-md border border-gray-300 py-2 px-3 text-sm"
                >
                  {sortedLanguages.map(lang => (
                    <optgroup key={lang} label={`${lang} (${groupedVoices[lang].length} voices)`}>
                      {groupedVoices[lang].map(voice => (
                        <option key={voice.name} value={voice.name}>
                          {voice.name} {voice.localService ? '(Local)' : '(Remote)'}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="mt-4 text-xs text-gray-500">
            Total voices available: {voices.length}
          </div>
        </div>
      )}
    </div>
  );
}
