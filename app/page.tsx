'use client';

import { useRouter } from 'next/navigation';
import { FiFileText, FiYoutube, FiArrowRight } from 'react-icons/fi';
import Navbar from './components/Navbar';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-20">
          <h1 className="text-3xl font-normal text-gray-900 mb-6 tracking-wide">
            Transform Your Content
          </h1>
          <p className="text-base text-gray-500 max-w-xl mx-auto leading-relaxed">
            Choose your preferred content format to begin the conversion process
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
          <button
            onClick={() => router.push('/pdf')}
            className="group relative p-12 bg-white border border-gray-200 hover:border-gray-900
              transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 flex items-center justify-center mb-10
                group-hover:scale-110 transition-transform duration-300">
                <FiFileText className="w-10 h-10 text-gray-900" />
              </div>
              <h2 className="text-lg text-gray-900 mb-4 tracking-widest uppercase">PDF Document</h2>
              <p className="text-sm text-gray-500 text-center leading-relaxed max-w-xs">
                Convert documents into conversational audio format
              </p>
              <div className="absolute bottom-8 right-8 opacity-0 transform translate-x-4
                group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                <FiArrowRight className="w-6 h-6 text-gray-900" />
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push('/youtube')}
            className="group relative p-12 bg-white border border-gray-200 hover:border-gray-900
              transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 flex items-center justify-center mb-10
                group-hover:scale-110 transition-transform duration-300">
                <FiYoutube className="w-10 h-10 text-gray-900" />
              </div>
              <h2 className="text-lg text-gray-900 mb-4 tracking-widest uppercase">YouTube Video</h2>
              <p className="text-sm text-gray-500 text-center leading-relaxed max-w-xs">
                Transform video content into audio conversations
              </p>
              <div className="absolute bottom-8 right-8 opacity-0 transform translate-x-4
                group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                <FiArrowRight className="w-6 h-6 text-gray-900" />
              </div>
            </div>
          </button>
        </div>
      </main>
    </div>
  );
}
