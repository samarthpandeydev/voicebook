import { useState, useRef, useEffect } from 'react';
import { FiSend, FiLoader, FiX, FiVolumeX, FiMic } from 'react-icons/fi';
import ChatDisclaimer from './ChatDisclaimer';
import { useBrowserFeatures } from '../hooks/useBrowserFeatures';

interface PodcastChatProps {
  onClose?: () => void;
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

export default function PodcastChat({ onClose, script }: PodcastChatProps) {
  const { synth, recognition, mounted } = useBrowserFeatures();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const silenceTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!synth || !mounted) return;

    const loadVoice = async () => {
      const voices = synth.getVoices();
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
    synth.addEventListener('voiceschanged', loadVoice);
    
    return () => {
      synth.removeEventListener('voiceschanged', loadVoice);
    };
  }, [synth, mounted]);

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
    
    recognition.onresult = (event: { resultIndex: any; results: { [x: string]: { transcript: any; }[]; }; }) => {
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
      const response = await fetch('/api/podcast-chat', {
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

  if (!mounted) return null;

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
            {onClose && (
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <FiX className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
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