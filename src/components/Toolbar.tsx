import React from 'react';

interface ToolbarProps {
  isMobile: boolean;
  isVisible: boolean;         // Nuovo: stato di visibilità passato da App
  onToggleVisibility: () => void; // Nuovo: funzione per cambiare visibilità
  isPhotoMode: boolean;
  onTogglePhoto: () => void;
  isOverlapMode: boolean;
  onToggleOverlap: () => void;
  hasStroke: boolean;
  onToggleStroke: () => void;
  isBlackAndWhite: boolean;
  onToggleBW: () => void;
  showCategoryLabels: boolean;
  onToggleCategory: () => void;
  currentSize: number;
  onSizeChange: (val: number) => void;
  onDelete: () => void;
  onSave: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  gravityEnabled: boolean;
  onToggleGravity: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onChaos: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  isMobile,
  isVisible, onToggleVisibility,
  isPhotoMode, onTogglePhoto,
  isOverlapMode, onToggleOverlap,
  hasStroke, onToggleStroke,
  isBlackAndWhite, onToggleBW,
  showCategoryLabels, onToggleCategory,
  currentSize, onSizeChange,
  onDelete, onSave,
  soundEnabled, onToggleSound,
  gravityEnabled, onToggleGravity,
  isDarkMode, onToggleDarkMode,
  onChaos
}) => {
  
  // ════════════ MOBILE VERSION ════════════
  if (isMobile) {
    // Stato CHIUSO: Barra minima in basso
    if (!isVisible) {
      return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto animate-fade-in-up">
           <button 
            onClick={onToggleVisibility}
            className="bg-black text-white dark:bg-white dark:text-black px-6 py-3 rounded-full shadow-lg text-sm font-medium uppercase tracking-widest border border-white/20 dark:border-black/20"
          >
            Tools
          </button>
        </div>
      );
    }

    // Stato APERTO: Pannello completo
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-auto bg-white/95 dark:bg-black/95 backdrop-blur-md border-t border-black dark:border-white safe-area-bottom pb-4 transition-transform duration-300">
        
        {/* Header chiusura toolbar mobile */}
        <div className="flex justify-center -mt-3 mb-2" onClick={onToggleVisibility}>
           <div className="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full cursor-pointer" />
        </div>

        {/* Size slider row */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-black/10 dark:border-white/10 mb-2">
          <span className="text-[10px] font-medium dark:text-white min-w-[30px] uppercase">Size</span>
          <input 
            type="range" 
            min="30" 
            max="150" 
            step="1"
            value={currentSize} 
            onChange={(e) => onSizeChange(parseInt(e.target.value))}
            className="flex-1 h-6"
          />
          <span className="text-[10px] font-medium dark:text-white min-w-[25px] text-right">{currentSize}</span>
        </div>
        
        {/* Buttons row */}
        <div className="flex overflow-x-auto no-scrollbar gap-2 px-3 pb-2">
          <MobileBtn active={isPhotoMode} onClick={onTogglePhoto}>
            {isPhotoMode ? 'Photo' : 'Color'}
          </MobileBtn>
          <MobileBtn active={isOverlapMode} onClick={onToggleOverlap}>
            {isOverlapMode ? 'Acetate' : 'Normal'}
          </MobileBtn>
          <MobileBtn active={hasStroke} onClick={onToggleStroke}>
            Border
          </MobileBtn>
          <MobileBtn active={gravityEnabled} onClick={onToggleGravity}>
            {gravityEnabled ? 'Gravity' : 'Float'}
          </MobileBtn>
          <MobileBtn active={isDarkMode} onClick={onToggleDarkMode}>
            {isDarkMode ? 'Dark' : 'Light'}
          </MobileBtn>
          <MobileBtn active={false} onClick={onChaos}>
            Chaos
          </MobileBtn>
          <MobileBtn active={false} onClick={onDelete}>
            Clear
          </MobileBtn>
          <MobileBtn active={false} onClick={onSave}>
            Save
          </MobileBtn>
          {/* Tasto chiudi esplicito anche nello scroll */}
          <MobileBtn active={true} onClick={onToggleVisibility}>
            Close
          </MobileBtn>
        </div>
      </div>
    );
  }

  // ════════════ DESKTOP VERSION ════════════
  
  // Stato CHIUSO: Tasto laterale
  if (!isVisible) {
    return (
      <div className="fixed left-0 top-1/2 -translate-y-1/2 z-50 pointer-events-auto pl-2">
        <button 
          onClick={onToggleVisibility}
          className="bg-white dark:bg-black border border-black dark:border-white w-8 h-12 flex items-center justify-center hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
        >
          <span className="text-lg">+</span>
        </button>
      </div>
    );
  }

  // Stato APERTO: Pannello laterale completo
  return (
    <div className="fixed left-5 top-1/2 -translate-y-1/2 w-64 bg-white dark:bg-black border border-black dark:border-white p-5 z-50 flex flex-col gap-1 pointer-events-auto transition-colors shadow-2xl">
      {/* Size slider */}
      <div className="mb-4 flex flex-col gap-2">
        <label className="text-[10px] suisse-regular opacity-60 dark:text-white uppercase tracking-wider">
          Size: {currentSize}px
        </label>
        <input 
          type="range" 
          min="20" 
          max="350" 
          step="1"
          value={currentSize} 
          onChange={(e) => onSizeChange(parseInt(e.target.value))}
          className="w-full h-5"
        />
      </div>

      <ToolButton active={isPhotoMode} onClick={onTogglePhoto}>
        Render: {isPhotoMode ? 'Asset' : 'Color'}
      </ToolButton>
      <ToolButton active={isOverlapMode} onClick={onToggleOverlap}>
        Overlap: {isOverlapMode ? 'Normal' : 'Acetate'}
      </ToolButton>
      <ToolButton active={hasStroke} onClick={onToggleStroke}>
        Border: {hasStroke ? 'Active' : 'Hidden'}
      </ToolButton>
      <ToolButton active={showCategoryLabels} onClick={onToggleCategory}>
        Metadata: {showCategoryLabels ? 'Visible' : 'Hidden'}
      </ToolButton>
      <ToolButton active={isBlackAndWhite} onClick={onToggleBW}>
        Palette: {isBlackAndWhite ? 'Mono' : 'RGB'}
      </ToolButton>
      
      <div className="my-2 border-t border-black/10 dark:border-white/10" />
      
      <ToolButton active={soundEnabled} onClick={onToggleSound}>
        Sound: {soundEnabled ? 'On' : 'Off'}
      </ToolButton>
      <ToolButton active={gravityEnabled} onClick={onToggleGravity}>
        Physics: {gravityEnabled ? 'Gravity' : 'Float'}
      </ToolButton>
      <ToolButton active={isDarkMode} onClick={onToggleDarkMode}>
        Theme: {isDarkMode ? 'Dark' : 'Light'}
      </ToolButton>
      <ToolButton active={false} onClick={onChaos}>
        Trigger Chaos
      </ToolButton>

      <div className="my-2 border-t border-black/10 dark:border-white/10" />

      <ToolButton onClick={onDelete}>Flush All</ToolButton>
      <ToolButton onClick={onSave}>Capture View</ToolButton>
      
      {/* Tasto per nascondere l'interfaccia (ora la minimizza) */}
      <ToolButton onClick={onToggleVisibility} active={true}>
        Hide Interface
      </ToolButton>
    </div>
  );
};

// Desktop button helper
const ToolButton: React.FC<{ active?: boolean; onClick: () => void; children: React.ReactNode }> = ({ 
  active, onClick, children 
}) => (
  <button 
    onClick={onClick}
    className={`w-full text-left px-4 py-2 text-[11px] border border-black dark:border-white transition-colors whitespace-nowrap suisse-regular mb-1
      ${active 
        ? 'bg-black text-white dark:bg-white dark:text-black' 
        : 'bg-white text-black hover:bg-gray-100 dark:bg-black dark:text-white dark:hover:bg-zinc-900'
      }`}
  >
    {children}
  </button>
);

// Mobile button helper
const MobileBtn: React.FC<{ active?: boolean; onClick: () => void; children: React.ReactNode }> = ({ 
  active, onClick, children 
}) => (
  <button 
    onClick={onClick}
    className={`flex-shrink-0 px-4 py-2 text-[10px] font-medium border border-black dark:border-white transition-colors whitespace-nowrap uppercase tracking-wider
      ${active 
        ? 'bg-black text-white dark:bg-white dark:text-black' 
        : 'bg-white text-black dark:bg-black dark:text-white'
      }`}
  >
    {children}
  </button>
);

export default Toolbar;