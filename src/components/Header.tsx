import React from 'react';
import { AppSection } from '../types';

interface HeaderProps {
  onToggleUi: () => void;
  onOpenSection: (section: AppSection) => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenSection }) => {
  return (
    <header className="fixed top-0 left-0 w-full flex justify-between items-center px-4 pt-6 pb-2 md:px-6 md:py-4 z-[70] pointer-events-none mix-blend-difference text-white safe-area-top transition-all duration-300">
      <div className="text-base md:text-lg tracking-tight pointer-events-auto cursor-default suisse-bold whitespace-nowrap">
        1:1 Archivio
      </div>
      
      <nav className="flex gap-4 md:gap-6 text-sm md:text-base pointer-events-auto suisse-medium whitespace-nowrap">
        <button 
          onClick={() => onOpenSection(AppSection.ARCHIVIO)} 
          className="hover:underline opacity-90 transition-opacity"
        >
          Archivio
        </button>
        <button 
          onClick={() => onOpenSection(AppSection.INFO)} 
          className="hover:underline opacity-90 transition-opacity"
        >
          Info
        </button>
        <button 
          onClick={() => onOpenSection(AppSection.EXPAND)} 
          className="hover:underline opacity-90 transition-opacity"
        >
          Expand
        </button>
        <button 
          onClick={() => onOpenSection(AppSection.UPLOAD)} 
          className="hover:underline opacity-90 transition-opacity"
        >
          Verify
        </button>
      </nav>
    </header>
  );
};

export default Header;