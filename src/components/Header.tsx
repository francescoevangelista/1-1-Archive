import React from 'react';
import { AppSection } from '../types';

interface HeaderProps {
  onToggleUi: () => void;
  onOpenSection: (section: AppSection) => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenSection }) => {
  return (
    // Aggiunto pt-8 su mobile (md:pt-4) per abbassare il menu rispetto al bordo superiore
    <header className="fixed top-0 left-0 w-full flex justify-between items-center px-4 pt-8 pb-3 md:px-6 md:py-4 z-[70] pointer-events-none bg-gradient-to-b from-white/80 to-transparent dark:from-black/80 backdrop-blur-[2px] safe-area-top transition-all duration-300">
      {/* Logo */}
      <div className="text-base md:text-lg font-bold tracking-widest pointer-events-auto cursor-default dark:text-white suisse-bold whitespace-nowrap">
        1:1 Archivio
      </div>
      
      {/* Navigation - Rimossa "UI", Upload -> Verify */}
      <nav className="flex gap-4 md:gap-5 text-sm md:text-base pointer-events-auto suisse-regular whitespace-nowrap">
        <button 
          onClick={() => onOpenSection(AppSection.ARCHIVIO)} 
          className="hover:opacity-100 opacity-70 dark:text-white transition-opacity"
        >
          Archivio
        </button>
        <button 
          onClick={() => onOpenSection(AppSection.INFO)} 
          className="hover:opacity-100 opacity-70 dark:text-white transition-opacity"
        >
          Info
        </button>
        <button 
          onClick={() => onOpenSection(AppSection.EXPAND)} 
          className="hover:opacity-100 opacity-70 dark:text-white transition-opacity"
        >
          Expand
        </button>
        <button 
          onClick={() => onOpenSection(AppSection.UPLOAD)} 
          className="hover:opacity-100 opacity-70 dark:text-white transition-opacity"
        >
          Verify
        </button>
      </nav>
    </header>
  );
};

export default Header;