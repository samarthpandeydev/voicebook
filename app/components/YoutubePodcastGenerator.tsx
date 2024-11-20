import { useState, useCallback } from 'react';
import { FiHeadphones, FiLoader, FiVolume2 } from 'react-icons/fi';
import AudioPlayer from './AudioPlayer';
import { useYoutube } from '../contexts/YoutubeContext';

interface DialogueLine {
  speaker: 'alex' | 'sarah';
  text: string;
}

interface YoutubePodcastGeneratorProps {
  onScriptGenerated: (script: string) => void;
}

export default function YoutubePodcastGenerator({ onScriptGenerated }: YoutubePodcastGeneratorProps) {
  const { currentVideoId } = useYoutube();
  const [script, setScript] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [dialogueLines, setDialogueLines] = useState<DialogueLine[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  const generatePodcast = async () => {
    setLoading(true);
    try {
      if (!currentVideoId) {
        throw new Error('No video selected');
      }

      console.log('Generating podcast for YouTube video:', currentVideoId);

      const response = await fetch('/api/generate-yt-podcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: currentVideoId,
          type: 'video'
        }),
      });
      
      const data = await response.json();
      
      if (data.error) throw new Error(data.error);

      // Parse the script into dialogue lines
      const lines = data.script.split('\n')
        .filter((line: string) => line.trim())
        .map((line: string) => {
          const [speaker, ...text] = line.split(':');
          return {
            speaker: speaker.toLowerCase() as 'alex' | 'sarah',
            text: text.join(':').trim()
          };
        });

      setScript(data.script);
      setDialogueLines(lines);
      onScriptGenerated(data.script);
    } catch (error) {
      console.error('Error generating podcast:', error);
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

  const handleSetIsPlaying = useCallback((value: boolean) => {
    setIsPlaying(value);
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-15rem)] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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

      <div className="flex-1 min-h-0">
        {script ? (
          <div className="h-full overflow-y-auto scrollbar-thin">
            <div className="p-6">
              {formatScriptForDisplay(script)}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 p-6">
            Click generate to create a podcast script
          </div>
        )}
      </div>

      {showPlayer && dialogueLines.length > 0 && (
        <div className="flex-none border-t p-4">
          <AudioPlayer
            dialogueLines={dialogueLines}
            isPlaying={isPlaying}
            setIsPlaying={handleSetIsPlaying}
          />
        </div>
      )}
    </div>
  );
}