import React, { useEffect, useRef } from 'react';
import Matter from 'matter-js';

interface CanvasAreaProps {
  hasStroke: boolean;
  isBlackAndWhite: boolean;
  isPhotoMode: boolean;
  isOverlapMode: boolean;
  showCategoryLabels: boolean;
  gravityEnabled: boolean;
  isUiVisible: boolean;
  isMobile: boolean;
  isDarkMode: boolean;
}

// Cache immagini per evitare sfarfallii
const imageCache = new Map<string, HTMLImageElement>();
const loadImage = (url: string) => {
  if (imageCache.has(url)) return;
  const img = new Image();
  img.src = url;
  img.onload = () => imageCache.set(url, img);
};

const CanvasArea: React.FC<CanvasAreaProps> = ({
  hasStroke,
  isBlackAndWhite,
  isPhotoMode,
  isOverlapMode,
  showCategoryLabels,
  gravityEnabled,
  isUiVisible,
  isMobile,
  isDarkMode
}) => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const wallsRef = useRef<{ [key: string]: Matter.Body } | null>(null);
  const bodiesMapRef = useRef<Map<number, Matter.Body>>(new Map());
  
  // Refs per i props che cambiano spesso (per usarli dentro il loop di render senza riavviare)
  const propsRef = useRef({ 
    hasStroke, isBlackAndWhite, isPhotoMode, isOverlapMode, showCategoryLabels, isDarkMode 
  });

  useEffect(() => {
    propsRef.current = { hasStroke, isBlackAndWhite, isPhotoMode, isOverlapMode, showCategoryLabels, isDarkMode };
  }, [hasStroke, isBlackAndWhite, isPhotoMode, isOverlapMode, showCategoryLabels, isDarkMode]);

  // 1. Inizializzazione Motore (Eseguito UNA volta sola)
  useEffect(() => {
    if (!sceneRef.current) return;

    const engine = Matter.Engine.create();
    engine.enableSleeping = false; 

    const render = Matter.Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: window.innerWidth,
        height: window.innerHeight,
        background: 'transparent',
        wireframes: false,
        pixelRatio: window.devicePixelRatio
      }
    });

    // Muri invisibili
    const wallThick = 200; // Muri spessi per evitare che gli oggetti scappino
    const width = window.innerWidth;
    const height = window.innerHeight;
    const wallOptions = { isStatic: true, render: { visible: false }, friction: 0.5 };

    const ground = Matter.Bodies.rectangle(width / 2, height + wallThick/2, width * 2, wallThick, { ...wallOptions, label: 'ground' });
    const leftWall = Matter.Bodies.rectangle(0 - wallThick/2, height / 2, wallThick, height * 5, { ...wallOptions, label: 'wall' });
    const rightWall = Matter.Bodies.rectangle(width + wallThick/2, height / 2, wallThick, height * 5, { ...wallOptions, label: 'wall' });
    const ceiling = Matter.Bodies.rectangle(width / 2, -wallThick * 2, width * 2, wallThick, { ...wallOptions, label: 'ceiling' });

    wallsRef.current = { ground, leftWall, rightWall, ceiling };
    Matter.World.add(engine.world, [ground, leftWall, rightWall, ceiling]);

    // Mouse Interaction
    const mouse = Matter.Mouse.create(render.canvas);
    mouse.pixelRatio = window.devicePixelRatio;
    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: { stiffness: 0.2, render: { visible: false } }
    });
    Matter.World.add(engine.world, mouseConstraint);

    // Eventi Drag (fondamentali per bloccare la generazione in App.tsx)
    Matter.Events.on(mouseConstraint, 'startdrag', () => {
        window.dispatchEvent(new CustomEvent('body-drag-start'));
    });
    Matter.Events.on(mouseConstraint, 'enddrag', () => {
        window.dispatchEvent(new CustomEvent('body-drag-end'));
    });

    // Rimuovi scroll indesiderato
    mouse.element.removeEventListener("mousewheel", (mouse as any).mousewheel);
    mouse.element.removeEventListener("DOMMouseScroll", (mouse as any).mousewheel);

    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);
    Matter.Render.run(render);

    engineRef.current = engine;
    renderRef.current = render;

    // Resize Handler nativo
    const handleResize = () => {
      if (!render.canvas || !wallsRef.current) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      
      render.canvas.width = w * window.devicePixelRatio;
      render.canvas.height = h * window.devicePixelRatio;
      render.options.width = w;
      render.options.height = h;
      
      Matter.Body.setPosition(wallsRef.current.rightWall, { x: w + 100, y: h / 2 });
      Matter.Body.setPosition(wallsRef.current.ground, { x: w / 2, y: h + 100 });
      Matter.Body.setPosition(wallsRef.current.ceiling, { x: w / 2, y: -200 });
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      Matter.Render.stop(render);
      Matter.Runner.stop(runner);
      if (render.canvas) render.canvas.remove();
      Matter.Engine.clear(engine);
      renderRef.current = null;
      engineRef.current = null;
    };
  }, []);

  // 2. Aggiornamento Muri Dinamico (Toolbar Mobile)
  useEffect(() => {
    if (!wallsRef.current || !engineRef.current) return;
    const h = window.innerHeight;
    const w = window.innerWidth;
    
    // Calcoliamo la posizione del pavimento in base alla toolbar
    // Se è mobile e UI visibile, alziamo il pavimento
    const toolbarOffset = (isMobile && isUiVisible) ? 320 : 0; 
    const wallThick = 200;
    
    // Posizioniamo il pavimento appena sotto l'area visibile o sopra la toolbar
    const groundY = h - toolbarOffset + (wallThick / 2);

    Matter.Body.setPosition(wallsRef.current.ground, { x: w / 2, y: groundY });
    
    // Svegliamo i corpi per farli reagire al nuovo pavimento
    Matter.Composite.allBodies(engineRef.current.world).forEach((body) => {
      if (!body.isStatic) Matter.Sleeping.set(body, false);
    });
  }, [isUiVisible, isMobile]);

  // 3. Event Listeners (Add, Clear, ecc.)
  useEffect(() => {
    const handleAddImage = (e: CustomEvent) => {
      if (!engineRef.current) return;
      const { image, size, x, y } = e.detail;
      const { id, url, category, averageColor } = image;

      loadImage(url); // Preload

      // BODY FISICO
      const body = Matter.Bodies.rectangle(x, y, size, size, {
        chamfer: { radius: 0 }, // ESSENZIALE: Rimuove il "quadrato interno"
        restitution: 0.4,
        friction: 0.1,
        frictionAir: 0.02,
        render: { visible: false }, // Non facciamo disegnare nulla a Matter
        label: category
      });

      (body as any).customData = { id, category, color: averageColor, w: size, h: size, url };
      bodiesMapRef.current.set(body.id, body);
      Matter.World.add(engineRef.current.world, body);
    };

    const handleClear = () => {
      if (!engineRef.current) return;
      const bodies = Array.from(bodiesMapRef.current.values());
      Matter.World.remove(engineRef.current.world, bodies);
      bodiesMapRef.current.clear();
    };
    
    const handleChaos = () => {
       if (!engineRef.current) return;
       const bodies = Array.from(bodiesMapRef.current.values());
       bodies.forEach(b => {
         const force = 0.05 * b.mass;
         Matter.Body.applyForce(b, b.position, { 
            x: (Math.random() - 0.5) * force, 
            y: (Math.random() - 0.8) * force 
         });
       });
    };

    const handleSave = () => {
        if (!renderRef.current || !renderRef.current.canvas) return;
        try {
            // Creiamo un canvas temporaneo per gestire lo sfondo
            const originalCanvas = renderRef.current.canvas;
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = originalCanvas.width;
            tempCanvas.height = originalCanvas.height;
            const ctx = tempCanvas.getContext('2d');
            if(ctx) {
                // Sfondo corretto in base al tema
                ctx.fillStyle = document.body.classList.contains('dark') ? '#000' : '#FFF';
                ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                ctx.drawImage(originalCanvas, 0, 0);
                
                const link = document.createElement('a');
                link.download = `archivio-capture.png`;
                link.href = tempCanvas.toDataURL('image/png');
                link.click();
            }
        } catch (err) { console.error(err); }
    };

    const handleResizeBodies = (e: CustomEvent) => {
        const newSize = e.detail;
        bodiesMapRef.current.forEach(body => {
            const currentW = (body as any).customData.w;
            const scale = newSize / currentW;
            Matter.Body.scale(body, scale, scale);
            (body as any).customData.w = newSize;
            (body as any).customData.h = newSize;
        });
    };

    window.addEventListener('add-image', handleAddImage as EventListener);
    window.addEventListener('clear-canvas', handleClear);
    window.addEventListener('chaos-trigger', handleChaos);
    window.addEventListener('save-canvas', handleSave);
    window.addEventListener('resize-bodies', handleResizeBodies as EventListener);
    
    return () => {
      window.removeEventListener('add-image', handleAddImage as EventListener);
      window.removeEventListener('clear-canvas', handleClear);
      window.removeEventListener('chaos-trigger', handleChaos);
      window.removeEventListener('save-canvas', handleSave);
      window.removeEventListener('resize-bodies', handleResizeBodies as EventListener);
    };
  }, []);

  // 4. CUSTOM RENDER LOOP (La parte grafica corretta)
  useEffect(() => {
    if (!renderRef.current) return;
    const render = renderRef.current;
    
    const customRender = () => {
      const ctx = render.context;
      if (!ctx) return;
      
      const { hasStroke, isBlackAndWhite, isPhotoMode, isOverlapMode, showCategoryLabels, isDarkMode } = propsRef.current;
      const bodies = Array.from(bodiesMapRef.current.values());

      bodies.forEach(body => {
        const { x, y } = body.position;
        const customData = (body as any).customData;
        if (!customData) return;
        
        const { w, h, category, color, url } = customData;
        const angle = body.angle;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        // IMPOSTAZIONI ACETATO
        if (isOverlapMode) {
           ctx.globalCompositeOperation = 'multiply'; 
           ctx.globalAlpha = 0.85; // Leggera trasparenza per blending
        }

        // DISEGNO CONTENUTO (Foto o Colore)
        const drawX = -w / 2;
        const drawY = -h / 2;

        if (isPhotoMode && url) {
            const img = imageCache.get(url);
            if (img) {
                if (isBlackAndWhite) ctx.filter = 'grayscale(100%)';
                ctx.drawImage(img, drawX, drawY, w, h);
                ctx.filter = 'none'; // Reset filtro
            } else {
                // Fallback colore mentre carica
                ctx.fillStyle = '#ccc';
                ctx.fillRect(drawX, drawY, w, h);
            }
        } else {
            // Render Color Mode
            ctx.fillStyle = isBlackAndWhite ? '#333' : color;
            ctx.fillRect(drawX, drawY, w, h);
        }

        // Reset Composite per le etichette e i bordi (che devono essere nitidi)
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1.0;

        // BORDI (Stroke)
        if (hasStroke) {
          ctx.strokeStyle = isDarkMode ? '#FFF' : '#000';
          ctx.lineWidth = 1;
          ctx.strokeRect(drawX, drawY, w, h);
        }

        // ETICHETTE (Metadati)
        if (showCategoryLabels) {
          const fontSize = 9;
          ctx.font = `${fontSize}px "Suisse Intl Mono", monospace`;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          
          const text = category;
          const textWidth = ctx.measureText(text).width;
          const pad = 4;
          
          // Posizione: Alto a sinistra, interno
          const labelX = drawX;
          const labelY = drawY;

          // Sfondo etichetta
          ctx.fillStyle = isDarkMode ? '#000' : '#FFF';
          ctx.fillRect(labelX, labelY, textWidth + pad*2, fontSize + pad*1.5);
          
          // Testo
          ctx.fillStyle = isDarkMode ? '#FFF' : '#000';
          ctx.fillText(text, labelX + pad, labelY + 2);
        }

        ctx.restore();
      });
    };

    Matter.Events.on(render, 'afterRender', customRender);
    return () => {
        Matter.Events.off(render, 'afterRender', customRender);
    };

  }, []); // Dipendenze vuote, usiamo propsRef

  // 5. Gravità
  useEffect(() => {
    if (!engineRef.current) return;
    engineRef.current.world.gravity.y = gravityEnabled ? 1.5 : 0;
    Matter.Composite.allBodies(engineRef.current.world).forEach((body) => {
       if (!body.isStatic) Matter.Sleeping.set(body, false);
    });
  }, [gravityEnabled]);

  return (
    <div 
      ref={sceneRef} 
      className="absolute inset-0 z-10 touch-none" // touch-none essenziale per mobile
    />
  );
};

export default CanvasArea;