import { useState } from 'react';
import { FiHeadphones, FiLoader, FiVolume2 } from 'react-icons/fi';
import AudioPlayer from './AudioPlayer';
import PodcastChat from './PodcastChat';
import ClientLayout from './ClientLayout';

interface DialogueLine {
  speaker: 'alex' | 'sarah';
  text: string;
}

interface PodcastGeneratorProps {
  onScriptGenerated: (script: string) => void;
}

export default function PodcastGenerator({ onScriptGenerated }: PodcastGeneratorProps) {
  const [script, setScript] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [dialogueLines, setDialogueLines] = useState<DialogueLine[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  const generatePodcast = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/generate-podcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfName: localStorage.getItem('currentPdfName')
        }),
      });
      const data = await response.json();
      
      if (!data.script) {
        throw new Error('No script received from API');
      }

      setScript(data.script);
      onScriptGenerated(data.script);
      
      // Parse and organize lines
      const lines = data.script.split('\n')
        .map((line: { trim: () => any; split: (arg0: string) => [any, ...any[]]; }) => {
          const trimmedLine = line.trim();
          if (!trimmedLine.startsWith('Alex:') && !trimmedLine.startsWith('Sarah:')) return null;
          
          const [speaker, ...textParts] = line.split(':');
          return {
            speaker: speaker.toLowerCase() as 'alex' | 'sarah',
            text: textParts.join(':').trim()
              .replace(/\[\d{1,2}:\d{1,2}\]/g, '')
              .replace(/\[[^\]]+\]/g, '')
              .replace(/\*([^*]+)\*/g, '')
              .trim()
          };
        })
        .filter((line: { text: string | any[]; } | null): line is DialogueLine => 
          line !== null && line.text.length > 0
        );

      // Organize into alternating pairs
      const orderedLines: DialogueLine[] = [];
      const alexLines = lines.filter((l: { speaker: string; }) => l.speaker === 'alex');
      const sarahLines = lines.filter((l: { speaker: string; }) => l.speaker === 'sarah');
      
      const maxPairs = Math.min(alexLines.length, sarahLines.length);
      for (let i = 0; i < maxPairs; i++) {
        orderedLines.push(alexLines[i], sarahLines[i]);
      }

      setDialogueLines(orderedLines);
    } catch (error) {
      console.error('Error generating podcast:', error);
      alert('Failed to generate podcast. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatScriptForDisplay = (script: string) => {
    return script.split('\n').map((line, index) => {
      const styledLine = line
        .replace(/\[([^\]]+)\]/g, '<span class="text-purple-600">[$1]</span>')
        .replace(/\*([^*]+)\*/g, '<span class="text-gray-500 italic">$1</span>');
      
      return (
        <div 
          key={index} 
          className="mb-2"
          dangerouslySetInnerHTML={{ __html: styledLine }}
        />
      );
    });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex-none p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Podcast Script</h2>
          <div className="flex gap-4">
            <button
              onClick={generatePodcast}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? (
                <FiLoader className="w-5 h-5 animate-spin" />
              ) : (
                <FiHeadphones className="w-5 h-5" />
              )}
              Generate Podcast
            </button>

            {script && !loading && (
              <button
                onClick={() => setShowPlayer(!showPlayer)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
              >
                <FiVolume2 className="w-5 h-5" />
                {showPlayer ? 'Hide Player' : 'Play Podcast'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-hidden">
        {script ? (
          <div className="h-full overflow-y-auto scrollbar-thin">
            <div className="p-6 prose max-w-none">
              {formatScriptForDisplay(script)}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 p-6">
            Click generate to create a podcast script
          </div>
        )}
      </div>

      {/* Player Section */}
      {showPlayer && dialogueLines.length > 0 && (
        <div className="flex-none border-t p-4">
          <ClientLayout>
            <AudioPlayer
              dialogueLines={dialogueLines}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
            />
          </ClientLayout>
        </div>
      )}
    </div>
  );
}