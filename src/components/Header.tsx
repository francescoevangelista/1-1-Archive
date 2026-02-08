import React from 'react';
import { AppSection } from '../types';

interface HeaderProps {
  onToggleUi: () => void;
  onOpenSection: (section: AppSection) => void;
  activeSection: AppSection;
}

const Header: React.FC<HeaderProps> = ({ onOpenSection, activeSection }) => {
  const menuItems = [
    { id: AppSection.ARCHIVIO, label: 'Archivio' },
    { id: AppSection.INFO, label: 'Info' },
    { id: AppSection.EXPAND, label: 'Expand' },
    { id: AppSection.UPLOAD, label: 'Verify' },
  ];

  return (
    // Aumentato pt-4 -> pt-12 per mobile per evitare la notch/status bar
    <header className="fixed top-0 left-0 w-full flex justify-between items-center px-4 pt-12 pb-4 md:px-6 md:py-5 z-[70] pointer-events-none mix-blend-difference text-white safe-area-top transition-all duration-300">
      
      <div className="text-[15px] md:text-lg tracking-tight pointer-events-auto cursor-default suisse-medium whitespace-nowrap leading-none">
        1:1 Archivio
      </div>
      
      <nav className="flex gap-4 md:gap-6 text-[13px] md:text-base pointer-events-auto leading-none">
        {menuItems.map((item) => (
          <button 
            key={item.id}
            onClick={() => onOpenSection(item.id)} 
            className={`transition-all duration-200 ${
              activeSection === item.id 
                ? 'suisse-medium underline underline-offset-4 opacity-100' 
                : 'suisse-regular opacity-70 hover:opacity-100 hover:underline hover:underline-offset-4'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </header>
  );
};

export default Header;