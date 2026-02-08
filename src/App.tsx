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
  
  // Stati Toolbar
  const [hasStroke, setHasStroke] = useState(false);
  const [isBlackAndWhite, setIsBlackAndWhite] = useState(false);
  const [isPhotoMode, setIsPhotoMode] = useState(true);
  const [isOverlapMode, setIsOverlapMode] = useState(false);
  const [showCategoryLabels, setShowCategoryLabels] = useState(true);
  const [currentSize, setCurrentSize] = useState(() => window.innerWidth < 768 ? 80 : 120);
  
  const [activeSection, setActiveSection] = useState<AppSection>(AppSection.NONE);
  const [isStarted, setIsStarted] = useState(false);
  
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [gravityEnabled, setGravityEnabled] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const isMobile = useIsMobile();
  
  const genIntervalRef = useRef<number | null>(null);
  const mousePosRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const isDraggingBodyRef = useRef(false); 
  const stateRef = useRef({ imageCount, maxCount, soundEnabled });
  const sizeRef = useRef(currentSize);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Sync Refs
  useEffect(() => { stateRef.current = { imageCount, maxCount, soundEnabled }; }, [imageCount, maxCount, soundEnabled]);
  useEffect(() => { sizeRef.current = currentSize; }, [currentSize]);
  
  // Tema Scuro
  useEffect(() => { document.body.classList.toggle('dark', isDarkMode); }, [isDarkMode]);

  // Listener per Dragging dal Canvas (per non generare mentre sposti)
  useEffect(() => {
    const startDrag = () => { isDraggingBodyRef.current = true; };
    const endDrag = () => { isDraggingBodyRef.current = false; };
    window.addEventListener('body-drag-start', startDrag);
    window.addEventListener('body-drag-end', endDrag);
    return () => {
        window.removeEventListener('body-drag-start', startDrag);
        window.removeEventListener('body-drag-end', endDrag);
    };
  }, []);

  const handleSizeChange = (newSize: number) => {
      setCurrentSize(newSize);
      window.dispatchEvent(new CustomEvent('resize-bodies', { detail: newSize }));
  };

  const playSound = useCallback(() => {
    if (!stateRef.current.soundEnabled) return;
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(800 + Math.random() * 400, ctx.currentTime);
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) { console.warn(e); }
  }, []);

  // Tracking Mouse/Touch
  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      let cx, cy;
      if ('touches' in e) {
          cx = e.touches[0].clientX;
          cy = e.touches[0].clientY;
      } else {
          cx = (e as MouseEvent).clientX;
          cy = (e as MouseEvent).clientY;
      }
      mousePosRef.current = { x: cx, y: cy };
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
    };
  }, []);

  const addImageToCanvas = useCallback((customUrl?: string, customLabel?: string, forceCenter = false) => {
    if (!isStarted) setIsStarted(true);
    
    if (!customUrl && stateRef.current.imageCount >= stateRef.current.maxCount) {
      if (genIntervalRef.current) clearInterval(genIntervalRef.current);
      return;
    }

    const id = (stateRef.current.imageCount % 88) + 1;
    let category: Category = 'GRA';
    if (((id - 1) % 88) < 22) category = 'AMB';
    else if (((id - 1) % 88) < 44) category = 'STL';
    else if (((id - 1) % 88) < 66) category = 'FIG';

    const finalCat = customLabel ? (customLabel as Category) : category;
    
    const colors: Record<string, string> = { AMB: '#D4C5B0', STL: '#B8A898', FIG: '#9CAF88', GRA: '#4A4A4A', EXP: '#E5E5E5' };

    const imgObj: ImageObject = {
      id,
      url: customUrl || `assets/img-${id}.png`,
      category: finalCat,
      averageColor: colors[finalCat] || '#ccc'
    };
    
    playSound();

    let x, y;
    if (forceCenter) {
        x = window.innerWidth / 2;
        y = window.innerHeight / 3;
    } else {
        x = mousePosRef.current.x;
        y = mousePosRef.current.y;
        
        const pad = sizeRef.current / 2 + 20;
        x = Math.max(pad, Math.min(window.innerWidth - pad, x));
        y = Math.max(pad, Math.min(window.innerHeight - pad, y));
    }

    window.dispatchEvent(new CustomEvent('add-image', { 
      detail: { image: imgObj, size: sizeRef.current, x, y } 
    }));
    
    setImageCount(prev => prev + 1);
  }, [isStarted, playSound]);

  const startGenerating = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('.pointer-events-auto')) return;
    if (activeSection !== AppSection.NONE) return;
    
    if (isDraggingBodyRef.current) return;

    if ('touches' in e) {
       mousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else {
       mousePosRef.current = { x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY };
    }

    addImageToCanvas();
    
    if (genIntervalRef.current) clearInterval(genIntervalRef.current);
    genIntervalRef.current = window.setInterval(() => {
        if (!isDraggingBodyRef.current) addImageToCanvas();
    }, 120);
  }, [addImageToCanvas, activeSection]);

  const stopGenerating = useCallback(() => {
    if (genIntervalRef.current) {
      clearInterval(genIntervalRef.current);
      genIntervalRef.current = null;
    }
  }, []);

  const handleExpandUpload = (file: File) => {
    setIsStarted(true);
    setActiveSection(AppSection.NONE);
    const url = URL.createObjectURL(file);
    setMaxCount(prev => prev + 1);
    setTimeout(() => addImageToCanvas(url, 'EXP', true), 300);
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
        <h1 className="text-black dark:text-white acetate-layer suisse-bold leading-none select-none tracking-tighter"
            style={{ fontSize: 'clamp(4rem, 35vw, 70rem)' }}>
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
        isDarkMode={isDarkMode}
      />

      <Header 
        onToggleUi={() => setIsUiVisible(!isUiVisible)} 
        onOpenSection={(section) => setActiveSection(section === activeSection ? AppSection.NONE : section)}
        activeSection={activeSection} 
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
        onSizeChange={handleSizeChange}
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