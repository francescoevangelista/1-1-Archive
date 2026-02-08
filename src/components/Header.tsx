import React from 'react';
import { AppSection } from '../types';

interface HeaderProps {
  onToggleUi: () => void;
  onOpenSection: (section: AppSection) => void;
  activeSection: AppSection;
}

const Header: React.FC<HeaderProps> = ({ onOpenSection, activeSection }) => {
  return (
    <header className="fixed top-0 left-0 w-full flex justify-between items-center px-4 pt-4 pb-2 md:px-6 md:pt-5 md:pb-3 z-[70] pointer-events-none mix-blend-difference text-white safe-area-top transition-all duration-300">
      <div className="text-[15px] md:text-[17px] tracking-tight pointer-events-auto cursor-default suisse-medium whitespace-nowrap leading-none">
        1:1 Archivio
      </div>

      <nav className="flex gap-3 md:gap-5 text-[13px] md:text-[15px] pointer-events-auto whitespace-nowrap leading-none">
        {([
          { key: AppSection.ARCHIVIO, label: 'Archivio' },
          { key: AppSection.INFO, label: 'Info' },
          { key: AppSection.EXPAND, label: 'Expand' },
          { key: AppSection.UPLOAD, label: 'Verify' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onOpenSection(key)}
            className={`transition-all duration-200 ${
              activeSection === key
                ? 'suisse-medium underline underline-offset-2'
                : 'suisse-regular opacity-80 hover:opacity-100 hover:underline hover:underline-offset-2'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>
    </header>
  );
};

export default Header;
