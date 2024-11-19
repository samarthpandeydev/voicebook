import { useState, useEffect } from 'react';
import { FiSettings, FiSun, FiMoon, FiX } from 'react-icons/fi';
import { useTheme } from './ThemeProvider';

export default function SettingsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isOpen && !(e.target as Element).closest('.settings-menu')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative settings-menu">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-lg bg-gray-100 dark:bg-dark-card hover:bg-gray-200 
          dark:hover:bg-gray-700 transition-colors duration-200"
        title="Settings"
      >
        <FiSettings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-dark-card 
          shadow-lg border border-gray-200 dark:border-dark-border transform origin-top-right 
          transition-all duration-200 ease-out">
          <div className="p-2">
            <button
              onClick={() => {
                toggleTheme();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2.5 text-left rounded-lg flex items-center gap-3
                text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700
                transition-colors duration-200"
            >
              {theme === 'light' ? (
                <>
                  <FiMoon className="w-5 h-5" />
                  <span className="font-medium">Switch to Dark Mode</span>
                </>
              ) : (
                <>
                  <FiSun className="w-5 h-5" />
                  <span className="font-medium">Switch to Light Mode</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}