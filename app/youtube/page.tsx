'use client';

import { useState } from 'react';
import { FiYoutube, FiLoader } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import YoutubePodcastGenerator from '../components/YoutubePodcastGenerator';
import YoutubePodcastChat from '../components/YoutubePodcastChat';

export default function YouTubePage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isProcessed, setIsProcessed] = useState(false);
  const [podcastScript, setPodcastScript] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/youtube', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.message === 'Video already processed') {
          setMessage('This YouTube video is already in the database!');
        } else {
          setMessage('YouTube video successfully processed and stored!');
        }
        setIsProcessed(true);
        if (typeof window !== 'undefined') {
          localStorage.setItem('currentVideoId', data.videoId);
        }
      } else {
        setMessage('Error: ' + data.error);
      }
    } catch (error) {
      setMessage('Error processing video');
    } finally {
      setLoading(false);
    }
  };

  const handleScriptGenerated = (script: string) => {
    setPodcastScript(script);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main className="pt-20 pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {!isProcessed ? (
          <div className="max-w-xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Process YouTube Video
                </h2>
                <p className="text-gray-600">
                  Enter a YouTube video URL to convert it into a podcast format
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="url" className="text-sm font-medium text-gray-700">
                    YouTube URL
                  </label>
                  <input
                    type="url"
                    id="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={!url || loading}
                  className={`w-full py-3 px-4 rounded-xl text-white font-medium 
                    transition-all transform hover:scale-[1.02] active:scale-[0.98]
                    ${!url || loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl'
                    }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    {loading ? (
                      <>
                        <FiLoader className="w-5 h-5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <FiYoutube className="w-5 h-5" />
                        <span>Process Video</span>
                      </>
                    )}
                  </div>
                </button>
              </form>

              {message && (
                <div className={`mt-6 p-4 rounded-xl flex items-center space-x-2
                  ${message.includes('Error')
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-green-50 text-green-700 border border-green-200'
                  }`}
                >
                  <p>{message}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-28rem)]">
            <YoutubePodcastGenerator onScriptGenerated={handleScriptGenerated} />
            {podcastScript && <YoutubePodcastChat script={podcastScript} />}
          </div>
        )}
      </main>
    </div>
  );
}
