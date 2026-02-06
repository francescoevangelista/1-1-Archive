import { useState, useCallback, useEffect, useRef } from 'react';
import Header from './components/Header';
import Toolbar from './components/Toolbar';
import CanvasArea from './components/CanvasArea';
import Overlay from './components/Overlay';
import { AppSection, Category, ImageObject } from './types';
import { useIsMobile } from './hooks/useIsMobile';

function App() {
  const [imageCount, setImageCount] = useState(0);
  const [maxCount, setMaxCount] = useState(88);
  const [isUiVisible, setIsUiVisible] = useState(true);
  const [hasStroke, setHasStroke] = useState(false);
  const [isBlackAndWhite, setIsBlackAndWhite] = useState(false);
  const [isPhotoMode, setIsPhotoMode] = useState(true);
  const [isOverlapMode, setIsOverlapMode] = useState(false);
  const [showCategoryLabels, setShowCategoryLabels] = useState(true);
  const [currentSize, setCurrentSize] = useState(() => window.innerWidth < 768 ? 70 : 100);
  const [activeSection, setActiveSection] = useState<AppSection>(AppSection.NONE);
  const [isStarted, setIsStarted] = useState(false);
  
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [gravityEnabled, setGravityEnabled] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const isMobile = useIsMobile();
  
  const genIntervalRef = useRef<number | null>(null);
  const mousePosRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const stateRef = useRef({ imageCount, maxCount, soundEnabled });
  const sizeRef = useRef(currentSize);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    stateRef.current = { imageCount, maxCount, soundEnabled };
  }, [imageCount, maxCount, soundEnabled]);

  useEffect(() => {
    sizeRef.current = currentSize;
  }, [currentSize]);

  useEffect(() => {
    document.body.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const playSound = useCallback(() => {
    if (!stateRef.current.soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(800 + Math.random() * 400, ctx.currentTime);
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }, []);

  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    };
    const onTouch = (e: TouchEvent) => {
      if (e.touches[0]) {
        mousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };
    window.addEventListener('mousemove', onMouse);
    window.addEventListener('touchmove', onTouch, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('touchmove', onTouch);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveSection(AppSection.NONE);
        window.dispatchEvent(new CustomEvent('close-zoomed-view'));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const getCategory = (index: number): Category => {
    const safe = ((index - 1) % 88) + 1;
    if (safe <= 22) return 'AMB';
    if (safe <= 44) return 'STL';
    if (safe <= 66) return 'FIG';
    return 'GRA';
  };

  const getColor = (cat: Category): string => {
    const colors: Record<Category, string> = { 
      AMB: '#D4C5B0', 
      STL: '#B8A898', 
      FIG: '#9CAF88', 
      GRA: '#4A4A4A' 
    };
    return colors[cat];
  };

  const addImageToCanvas = useCallback((customUrl?: string, customLabel?: string, force = false) => {
    if (!isStarted) setIsStarted(true);
    
    if (!force && stateRef.current.imageCount >= stateRef.current.maxCount) {
      if (genIntervalRef.current) {
        clearInterval(genIntervalRef.current);
        genIntervalRef.current = null;
      }
      return;
    }

    const id = (stateRef.current.imageCount % 88) + 1;
    const cat = getCategory(id);
    const imgObj: ImageObject = {
      id,
      url: customUrl || `assets/img-${id}.png`,
      category: (customLabel as Category) || cat,
      averageColor: getColor(cat)
    };
    
    playSound();

    const size = sizeRef.current;
    const half = size / 2;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const mobile = vw < 768;
    
    const headerH = 56;
    const toolbarH = (mobile && isUiVisible) ? 110 : 0;
    const sidebarW = (!mobile && isUiVisible) ? 280 : 0;
    
    const left = sidebarW + half + 15;
    const right = vw - half - 15;
    const top = headerH + half + 15;
    const bottom = vh - toolbarH - half - 15;

    const x = Math.max(left, Math.min(right, mousePosRef.current.x));
    const y = Math.max(top, Math.min(bottom, mousePosRef.current.y));

    window.dispatchEvent(new CustomEvent('add-image', { 
      detail: { image: imgObj, size, x, y } 
    }));
    
    setImageCount(prev => prev + 1);
  }, [isStarted, isUiVisible, playSound]);

  const startGenerating = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.pointer-events-auto') && !target.closest('canvas')) return;
    
    if (activeSection !== AppSection.NONE) return;
    if (document.body.getAttribute('data-is-over-body') === 'true') return;

    if ('clientX' in e) {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    } else if ('touches' in e && e.touches[0]) {
      mousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }

    addImageToCanvas();
    
    if (genIntervalRef.current) clearInterval(genIntervalRef.current);
    genIntervalRef.current = window.setInterval(addImageToCanvas, 100);
  }, [addImageToCanvas, activeSection]);

  const stopGenerating = useCallback(() => {
    if (genIntervalRef.current) {
      clearInterval(genIntervalRef.current);
      genIntervalRef.current = null;
    }
  }, []);

  const handleExpandUpload = (file: File) => {
    if (!isStarted) setIsStarted(true);
    setActiveSection(AppSection.NONE);
    const url = URL.createObjectURL(file);
    setMaxCount(prev => prev + 1);
    setTimeout(() => addImageToCanvas(url, 'EXP', true), 50);
  };

  const triggerChaos = () => window.dispatchEvent(new CustomEvent('chaos-trigger'));

  return (
    <div 
      className="relative w-screen h-screen bg-white dark:bg-black overflow-hidden no-select transition-colors duration-300"
      onMouseDown={startGenerating}
      onMouseUp={stopGenerating}
      onMouseLeave={stopGenerating}
      onTouchStart={startGenerating}
      onTouchEnd={stopGenerating}
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <h1 
          className="text-black dark:text-white acetate-layer suisse-bold leading-none select-none tracking-tighter"
          style={{ fontSize: 'clamp(4rem, 35vw, 70rem)' }}
        >
          {!isStarted ? '1:1' : `${String(imageCount).padStart(2, '0')}/${maxCount}`}
        </h1>
      </div>

      <CanvasArea 
        hasStroke={hasStroke} 
        isBlackAndWhite={isBlackAndWhite}
        isPhotoMode={isPhotoMode}
        isOverlapMode={isOverlapMode}
        showCategoryLabels={showCategoryLabels}
        gravityEnabled={gravityEnabled}
        isUiVisible={isUiVisible}
        isMobile={isMobile}
      />

      <Header 
        onToggleUi={() => setIsUiVisible(!isUiVisible)} 
        onOpenSection={(section) => setActiveSection(section === activeSection ? AppSection.NONE : section)}
      />

      <Toolbar 
        isMobile={isMobile}
        isVisible={isUiVisible}
        onToggleVisibility={() => setIsUiVisible(!isUiVisible)}
        isPhotoMode={isPhotoMode}
        onTogglePhoto={() => setIsPhotoMode(!isPhotoMode)}
        isOverlapMode={isOverlapMode}
        onToggleOverlap={() => setIsOverlapMode(!isOverlapMode)}
        hasStroke={hasStroke}
        onToggleStroke={() => setHasStroke(!hasStroke)}
        isBlackAndWhite={isBlackAndWhite}
        onToggleBW={() => setIsBlackAndWhite(!isBlackAndWhite)}
        showCategoryLabels={showCategoryLabels}
        onToggleCategory={() => setShowCategoryLabels(!showCategoryLabels)}
        currentSize={currentSize}
        onSizeChange={setCurrentSize}
        onDelete={() => {
          setImageCount(0);
          setIsStarted(false);
          window.dispatchEvent(new CustomEvent('clear-canvas'));
        }}
        onSave={() => window.dispatchEvent(new CustomEvent('save-canvas'))}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        gravityEnabled={gravityEnabled}
        onToggleGravity={() => setGravityEnabled(!gravityEnabled)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onChaos={triggerChaos}
      />

      {activeSection !== AppSection.NONE && (
        <Overlay 
          section={activeSection} 
          onClose={() => setActiveSection(AppSection.NONE)} 
          onFileUpload={handleExpandUpload}
        />
      )}
    </div>
  );
}

export default App;