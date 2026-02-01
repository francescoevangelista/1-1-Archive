import React from 'react';

interface ToolbarProps {
  isMobile: boolean;
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
  onToggleControls: () => void;
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
  isPhotoMode, onTogglePhoto,
  isOverlapMode, onToggleOverlap,
  hasStroke, onToggleStroke,
  isBlackAndWhite, onToggleBW,
  showCategoryLabels, onToggleCategory,
  currentSize, onSizeChange,
  onDelete, onSave,
  onToggleControls,
  soundEnabled, onToggleSound,
  gravityEnabled, onToggleGravity,
  isDarkMode, onToggleDarkMode,
  onChaos
}) => {
  // MOBILE VERSION
  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-auto bg-white dark:bg-black border-t border-black dark:border-white safe-area-bottom">
        {/* Size slider row */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-black/20 dark:border-white/20">
          <span className="text-xs font-medium dark:text-white min-w-[40px]">Size</span>
          <input 
            type="range" 
            min="30" 
            max="150" 
            step="1"
            value={currentSize} 
            onChange={(e) => onSizeChange(parseInt(e.target.value))}
            className="flex-1 h-6"
          />
          <span className="text-xs font-medium dark:text-white min-w-[32px] text-right">{currentSize}</span>
        </div>
        
        {/* Buttons row */}
        <div className="flex overflow-x-auto no-scrollbar gap-2 px-3 py-3">
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
        </div>
      </div>
    );
  }

  // DESKTOP VERSION
  return (
    <div className="fixed left-5 top-1/2 -translate-y-1/2 w-64 bg-white dark:bg-black border border-black dark:border-white p-5 z-50 flex flex-col gap-1 pointer-events-auto transition-colors">
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
        Overlap: {isOverlapMode ? 'Acetate' : 'Normal'}
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
      <ToolButton onClick={onToggleControls}>Hide Interface</ToolButton>
    </div>
  );
};

// Desktop button
const ToolButton: React.FC<{ active?: boolean; onClick: () => void; children: React.ReactNode }> = ({ 
  active, onClick, children 
}) => (
  <button 
    onClick={onClick}
    className={`w-full text-left px-4 py-2 text-[11px] border border-black dark:border-white transition-colors whitespace-nowrap suisse-regular
      ${active 
        ? 'bg-black text-white dark:bg-white dark:text-black' 
        : 'bg-white text-black hover:bg-gray-100 dark:bg-black dark:text-white dark:hover:bg-zinc-900'
      }`}
  >
    {children}
  </button>
);

// Mobile button
const MobileBtn: React.FC<{ active?: boolean; onClick: () => void; children: React.ReactNode }> = ({ 
  active, onClick, children 
}) => (
  <button 
    onClick={onClick}
    className={`flex-shrink-0 px-4 py-2 text-sm font-medium border-2 border-black dark:border-white transition-colors whitespace-nowrap
      ${active 
        ? 'bg-black text-white dark:bg-white dark:text-black' 
        : 'bg-white text-black dark:bg-black dark:text-white'
      }`}
  >
    {children}
  </button>
);

export default Toolbar;
