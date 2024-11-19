import { useState } from 'react';
import Chatbot from './Chatbot';
import PodcastChat from './PodcastChat';

export default function ChatToggle() {
  const [activeChat, setActiveChat] = useState<'pdf' | 'podcast'>('pdf');

  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveChat('pdf')}
          className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
            activeChat === 'pdf'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          PDF Chat
        </button>
        <button
          onClick={() => setActiveChat('podcast')}
          className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
            activeChat === 'podcast'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Podcast Chat
        </button>
      </div>
      
      <div className="flex-1">
        {activeChat === 'pdf' ? <PodcastChat /> : <Chatbot />}
      </div>
    </div>
  );
}