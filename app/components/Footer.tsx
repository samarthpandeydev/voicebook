import { FiGithub, FiHeart } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          {/* Left section */}
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span className="font-medium">@voicebook</span>
          </div>

          {/* Center section */}
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-gray-400">built with</span>
            <FiHeart className="w-3 h-3 text-gray-400" />
            <span className="text-gray-400">proudly open source</span>
          </div>

          {/* Right section */}
          <a 
            href="https://github.com/your-username/your-repo" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <span className="transform transition-transform group-hover:-translate-y-px">
              do hit a star on
            </span>
            <FiGithub className="w-4 h-4 transform transition-transform group-hover:scale-110 group-hover:-translate-y-px" />
          </a>
        </div>
      </div>
    </footer>
  );
}