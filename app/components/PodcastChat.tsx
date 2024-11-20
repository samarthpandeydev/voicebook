import { useState, useRef, useEffect } from 'react';
import { FiSend, FiLoader, FiVolumeX, FiMic } from 'react-icons/fi';
import ChatDisclaimer from './ChatDisclaimer';
import { usePdf } from '../contexts/PdfContext';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface PodcastChatProps {
  script?: string;
}

interface Message {
  role: string;
  content: string;
  context?: Array<{
    text: string;
    page: number;
    relevance: number;
  }>;
}

export default function PodcastChat({ script }: PodcastChatProps) {
  const { currentPdfName } = usePdf();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [synth, setSynth] = useState<SpeechSynthesis | null>(null);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const silenceTimer = useRef<NodeJS.Timeout>();
  const [input, setInput] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSynth(window.speechSynthesis);
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        setRecognition(recognitionInstance);
      }

      const loadVoice = async () => {
        let voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) {
          await new Promise<void>((resolve) => {
            window.speechSynthesis.onvoiceschanged = () => {
              voices = window.speechSynthesis.getVoices();
              resolve();
            };
          });
        }
        
        const ukMaleVoice = voices.find(voice => 
          voice.name.includes('Google UK English Male')
        ) || voices.find(voice => 
          voice.lang === 'en-GB' && voice.name.includes('Male')
        ) || voices.find(voice => 
          voice.lang === 'en-US'
        ) || voices[0];
        
        setSelectedVoice(ukMaleVoice);
      };
      
      loadVoice();
    }
  }, []);

  const speakText = (text: string) => {
    if (!synth || !selectedVoice) return;

    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = selectedVoice;
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => {
      setSpeaking(false);
      if (text !== "Hello! How can I help you?" && text !== "Thank you for your question!") {
        speakText("Thank you for your question!");
      }
    };
    utterance.onerror = () => setSpeaking(false);

    synth.speak(utterance);
  };

  const startListening = () => {
    if (!recognition) return;
    
    setListening(true);
    setTranscript('');
    speakText("Hello! How can I help you?");
    
    recognition.onresult = (event) => {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript;
      setTranscript(transcript);
      
      if (silenceTimer.current) {
        clearTimeout(silenceTimer.current);
      }
      
      silenceTimer.current = setTimeout(() => {
        stopListening();
        handleVoiceInput(transcript);
      }, 2000);
    };

    recognition.start();
  };

  const stopListening = () => {
    if (!recognition) return;
    recognition.stop();
    setListening(false);
    setTranscript('');
    if (silenceTimer.current) {
      clearTimeout(silenceTimer.current);
    }
  };

  const handleVoiceInput = async (text: string) => {
    if (!text.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    try {
      const response = await fetch('/api/podcast-pdf-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages,
          script: script,
          pdfName: localStorage.getItem('currentPdfName')
        }),
      });
      
      const data = await response.json();
      const assistantMessage = { 
        role: 'assistant', 
        content: data.response,
        context: data.context 
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      speakText(data.response);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !currentPdfName) return;

    setLoading(true);
    try {
      const response = await fetch('/api/podcast-pdf-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          history: messages,
          pdfName: currentPdfName,
          script
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
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, there was an error processing your request.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex-none p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Podcast Chat</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={listening ? stopListening : startListening}
              className={`p-2.5 rounded-lg ${
                listening 
                  ? 'bg-gray-900 text-white hover:bg-gray-800' 
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
              title={listening ? "Stop listening" : "Start listening"}
            >
              <FiMic className="w-5 h-5" />
            </button>
            {speaking && (
              <button
                onClick={() => synth?.cancel()}
                className="p-2.5 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
              >
                <FiVolumeX className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-none p-4 border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 min-w-0 px-4 py-2.5 text-gray-600 placeholder-gray-400 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <FiLoader className="w-5 h-5 animate-spin" />
            ) : (
              <FiSend className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full overflow-y-auto scrollbar-thin">
          <div className="p-6 space-y-6">
            {messages.map((message, i) => (
              <div key={i}>
                <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {message.content}
                  </div>
                </div>
              </div>
            ))}
            
            {listening && transcript && (
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-lg px-4 py-3 bg-gray-200 text-gray-800">
                  {transcript}
                </div>
              </div>
            )}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-3">
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ChatDisclaimer />
    </div>
  );
}