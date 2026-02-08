import React from 'react';

interface ToolbarProps {
  isMobile: boolean;
  isVisible: boolean;
  onToggleVisibility: () => void;
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

  if (isMobile) {
    if (!isVisible) {
      return (
        <div
          className="fixed bottom-0 left-0 w-full z-50 pointer-events-auto"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }}
            className="w-full h-12 bg-white dark:bg-black border-t border-black dark:border-white flex items-center justify-center active:bg-gray-100 dark:active:bg-zinc-900 transition-colors"
          >
            <span className="text-lg suisse-medium">+</span>
          </button>
        </div>
      );
    }

    return (
      <div
        className="fixed bottom-0 left-0 w-full bg-white dark:bg-black border-t border-black dark:border-white z-50 pointer-events-auto flex flex-col"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {/* Drag handle to collapse */}
        <div
          onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }}
          className="w-full h-8 flex items-center justify-center border-b border-black/10 dark:border-white/10 cursor-pointer active:bg-gray-100 dark:active:bg-zinc-900"
        >
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        <div className="px-4 py-3 flex flex-col gap-1">
          {/* Size slider */}
          <div className="mb-3 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] suisse-medium opacity-60 dark:text-white uppercase tracking-wider">Size</label>
              <span className="text-[10px] suisse-mono dark:text-white">{currentSize}px</span>
            </div>
            <input
              type="range"
              min="20"
              max="250"
              step="1"
              value={currentSize}
              onChange={(e) => onSizeChange(parseInt(e.target.value))}
              className="w-full h-5"
            />
          </div>

          {/* Controls grid */}
          <div className="grid grid-cols-2 gap-2">
            <ToolButton active={isPhotoMode} onClick={onTogglePhoto}>
              {isPhotoMode ? 'Render: Asset' : 'Render: Color'}
            </ToolButton>
            <ToolButton active={isOverlapMode} onClick={onToggleOverlap}>
              {isOverlapMode ? 'Overlap: Acetate' : 'Overlap: Normal'}
            </ToolButton>
            <ToolButton active={hasStroke} onClick={onToggleStroke}>
              Border: {hasStroke ? 'Visible' : 'Hidden'}
            </ToolButton>
            <ToolButton active={gravityEnabled} onClick={onToggleGravity}>
              Physics: {gravityEnabled ? 'Gravity' : 'Float'}
            </ToolButton>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            <ToolButton onClick={onDelete}>Flush All</ToolButton>
            <ToolButton onClick={onSave}>Capture</ToolButton>
          </div>
        </div>
      </div>
    );
  }

  // ──────── DESKTOP ────────

  if (!isVisible) {
    return (
      <div className="fixed left-0 top-1/2 -translate-y-1/2 z-50 pointer-events-auto pl-2">
        <button
          onClick={onToggleVisibility}
          className="bg-white dark:bg-black border border-black dark:border-white w-8 h-12 flex items-center justify-center hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
        >
          <span className="text-lg suisse-medium">+</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed left-5 top-1/2 -translate-y-1/2 w-64 bg-white dark:bg-black border border-black dark:border-white p-5 z-50 flex flex-col gap-1 pointer-events-auto transition-colors"
      data-ui="true"
    >
      {/* Size slider */}
      <div className="mb-4 flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <label className="text-[10px] suisse-medium opacity-60 dark:text-white uppercase tracking-wider">Size</label>
          <span className="text-[10px] suisse-mono dark:text-white">{currentSize}px</span>
        </div>
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

      {/* Visual controls */}
      <ToolButton active={isPhotoMode} onClick={onTogglePhoto}>
        Render: {isPhotoMode ? 'Asset' : 'Color'}
      </ToolButton>
      <ToolButton active={isOverlapMode} onClick={onToggleOverlap}>
        Overlap: {isOverlapMode ? 'Acetate' : 'Normal'}
      </ToolButton>
      <ToolButton active={hasStroke} onClick={onToggleStroke}>
        Border: {hasStroke ? 'Visible' : 'Hidden'}
      </ToolButton>
      <ToolButton active={showCategoryLabels} onClick={onToggleCategory}>
        Metadata: {showCategoryLabels ? 'Visible' : 'Hidden'}
      </ToolButton>
      <ToolButton active={isBlackAndWhite} onClick={onToggleBW}>
        Palette: {isBlackAndWhite ? 'Mono' : 'RGB'}
      </ToolButton>

      <div className="my-2 border-t border-black/10 dark:border-white/10" />

      {/* Physics & system */}
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

      {/* Actions */}
      <ToolButton onClick={onDelete}>Flush All</ToolButton>
      <ToolButton onClick={onSave}>Capture View</ToolButton>
      <ToolButton onClick={onToggleVisibility} active={true}>
        Hide Interface
      </ToolButton>
    </div>
  );
};

const ToolButton: React.FC<{ active?: boolean; onClick: () => void; children: React.ReactNode }> = ({
  active, onClick, children
}) => (
  <button
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={`w-full text-left px-4 py-2 text-[11px] border border-black dark:border-white transition-colors whitespace-nowrap suisse-medium mb-1
      ${active
        ? 'bg-black text-white dark:bg-white dark:text-black'
        : 'bg-white text-black hover:bg-gray-100 dark:bg-black dark:text-white dark:hover:bg-zinc-900'
      }`}
  >
    {children}
  </button>
);

export default Toolbar;
