import { useState } from 'react';
import { FiSend, FiInfo } from 'react-icons/fi';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  context?: any[];
}

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showContext, setShowContext] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage,
          history: messages.slice(-4) // Send last 4 messages for context
        }),
      });
      
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response,
        context: data.context 
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error processing your request.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full bg-white dark:bg-gray-800 rounded-xl shadow-sm flex flex-col">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Chat with your PDF</h2>
        <button
          onClick={() => setShowContext(!showContext)}
          className="text-gray-500 hover:text-gray-700"
          title="Toggle context visibility"
        >
          <FiInfo className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message, i) => (
          <div key={i} className="space-y-2">
            <div
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {message.content}
              </div>
            </div>
            {showContext && message.context && (
              <div className="text-xs text-gray-500 ml-4">
                <div className="font-medium mb-1">Sources:</div>
                {message.context.map((ctx, j) => (
                  <div key={j} className="ml-2">
                    Page {ctx.page}: {ctx.text.substring(0, 100)}...
                    <span className="text-gray-400"> ({Math.round(ctx.relevance * 100)}% match)</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your PDF..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
          >
            <FiSend />
          </button>
        </div>
      </form>
    </div>
  );
}