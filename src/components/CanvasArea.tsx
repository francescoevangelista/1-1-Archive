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
}

const CanvasArea: React.FC<CanvasAreaProps> = ({
  hasStroke,
  isBlackAndWhite,
  isPhotoMode,
  isOverlapMode,
  showCategoryLabels,
  gravityEnabled,
  isUiVisible,
  isMobile
}) => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const wallsRef = useRef<{ [key: string]: Matter.Body } | null>(null);
  const bodiesMapRef = useRef<Map<number, Matter.Body>>(new Map());

  // 1. Setup Engine & World
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

    // Setup Muri
    const wallThick = 60;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const wallOptions = { isStatic: true, render: { visible: false }, friction: 0.5 };

    const ground = Matter.Bodies.rectangle(width / 2, height + wallThick / 2 - 10, width, wallThick, { ...wallOptions, label: 'ground' });
    const leftWall = Matter.Bodies.rectangle(0 - wallThick / 2, height / 2, wallThick, height * 5, { ...wallOptions, label: 'wall' });
    const rightWall = Matter.Bodies.rectangle(width + wallThick / 2, height / 2, wallThick, height * 5, { ...wallOptions, label: 'wall' });
    const ceiling = Matter.Bodies.rectangle(width / 2, -wallThick * 4, width, wallThick, { ...wallOptions, label: 'ceiling' });

    wallsRef.current = { ground, leftWall, rightWall, ceiling };
    Matter.World.add(engine.world, [ground, leftWall, rightWall, ceiling]);

    // Setup Mouse per trascinamento
    const mouse = Matter.Mouse.create(render.canvas);
    mouse.pixelRatio = window.devicePixelRatio;
    
    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: { stiffness: 0.2, render: { visible: false } }
    });
    Matter.World.add(engine.world, mouseConstraint);

    // FIX TRASCINAMENTO: Se clicco su un corpo, fermo la propagazione
    // Questo impedisce che App.tsx generi una nuova immagine mentre ne sposti una.
    Matter.Events.on(mouseConstraint, 'mousedown', (event: any) => {
        const mousePosition = event.mouse.position;
        const bodies = Matter.Composite.allBodies(engine.world);
        // Cerca se c'è un corpo sotto il mouse (esclusi i muri statici)
        const clickedBody = Matter.Query.point(bodies, mousePosition).find(b => !b.isStatic);
        
        if (clickedBody) {
            // Blocca l'evento verso il genitore (App.tsx)
            if (event.sourceEvents.mousedown) event.sourceEvents.mousedown.stopPropagation();
            if (event.sourceEvents.touchstart) event.sourceEvents.touchstart.stopPropagation();
        }
    });

    mouse.element.removeEventListener("mousewheel", (mouse as any).mousewheel);
    mouse.element.removeEventListener("DOMMouseScroll", (mouse as any).mousewheel);

    // Avvio
    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);
    Matter.Render.run(render);

    engineRef.current = engine;
    renderRef.current = render;

    // Resize Handler
    const handleResize = () => {
      if (!render.canvas || !wallsRef.current) return;
      render.canvas.width = window.innerWidth * window.devicePixelRatio;
      render.canvas.height = window.innerHeight * window.devicePixelRatio;
      render.options.width = window.innerWidth;
      render.options.height = window.innerHeight;
      
      Matter.Body.setPosition(wallsRef.current.rightWall, { x: window.innerWidth + 30, y: window.innerHeight / 2 });
      Matter.Body.setPosition(wallsRef.current.ground, { x: window.innerWidth / 2, y: window.innerHeight + 30 });
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

  // 2. PAVIMENTO DINAMICO
  useEffect(() => {
    if (!wallsRef.current || !engineRef.current) return;
    const height = window.innerHeight;
    const width = window.innerWidth;
    const wallThick = 60;
    // Su mobile la toolbar occupa spazio, alziamo il pavimento
    const toolbarHeight = isMobile && isUiVisible ? 280 : (isMobile ? 60 : 0); 
    const newY = height - toolbarHeight + (wallThick / 2);

    Matter.Body.setPosition(wallsRef.current.ground, { x: width / 2, y: newY });
    
    // Sveglia i corpi per farli riadattare al nuovo pavimento
    Matter.Composite.allBodies(engineRef.current.world).forEach((body) => {
      if (!body.isStatic) Matter.Sleeping.set(body, false);
    });
  }, [isUiVisible, isMobile]);

  // 3. Gestione Eventi (Add, Clear, Chaos, Save, RESIZE)
  useEffect(() => {
    const handleAddImage = (e: CustomEvent) => {
      if (!engineRef.current) return;
      const { image, size, x, y } = e.detail;
      const { id, url, category, averageColor } = image;

      // Creazione corpo fisico
      const body = Matter.Bodies.rectangle(x, y, size, size, {
        chamfer: { radius: 0 }, // IMPORTANTE: 0 raggio per evitare discrepanze grafiche
        restitution: 0.4,
        friction: 0.1,
        frictionAir: 0.02,
        render: {
            visible: isPhotoMode, 
            sprite: {
                texture: url,
                xScale: size / 400, // Assumendo immagini 400x400
                yScale: size / 400
            }
        },
        label: category
      });

      (body as any).customData = {
        id, category, color: averageColor, w: size, h: size,
      };

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
         const forceMagnitude = 0.05 * b.mass;
         Matter.Body.applyForce(b, b.position, { 
           x: (Math.random() - 0.5) * forceMagnitude,
           y: (Math.random() - 0.8) * forceMagnitude 
         });
       });
    };

    const handleSave = () => {
        if (!renderRef.current || !renderRef.current.canvas) return;
        try {
            const link = document.createElement('a');
            link.download = `capture-${Date.now()}.png`;
            link.href = renderRef.current.canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error(err);
        }
    };

    const handleResizeBodies = (e: CustomEvent) => {
        const newSize = e.detail;
        bodiesMapRef.current.forEach(body => {
            const currentW = (body as any).customData.w;
            const scaleFactor = newSize / currentW;
            Matter.Body.scale(body, scaleFactor, scaleFactor);
            (body as any).customData.w = newSize;
            (body as any).customData.h = newSize;
            if (body.render.sprite) {
                body.render.sprite.xScale = newSize / 400;
                body.render.sprite.yScale = newSize / 400;
            }
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
  }, [isPhotoMode]);

  // 4. Custom Render Loop (Correzione Grafica Totale)
  useEffect(() => {
    if (!renderRef.current) return;
    const render = renderRef.current;
    
    const customRender = () => {
      const ctx = render.context;
      if (!ctx) return;
      const bodies = Array.from(bodiesMapRef.current.values());

      bodies.forEach(body => {
        const { x, y } = body.position;
        const customData = (body as any).customData;
        if (!customData) return;
        
        const { w, h, category, color } = customData;
        const angle = body.angle;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        // 1. Render Colore Solido (se non è photo mode)
        if (!isPhotoMode) {
          ctx.fillStyle = isBlackAndWhite ? '#333' : color;
          // Disegna il rettangolo pieno che copre tutto il corpo
          ctx.fillRect(-w/2, -h/2, w, h);
        }
        
        // 2. Effetto Acetato (Overlap)
        // Disegna SOPRA l'immagine o il colore con multiply
        if (isOverlapMode) {
           ctx.globalCompositeOperation = 'multiply';
           // Colore leggermente caldo per l'acetato, copre TUTTA l'immagine
           ctx.fillStyle = document.body.classList.contains('dark') ? 'rgba(220, 210, 200, 0.5)' : 'rgba(40, 30, 20, 0.2)';
           ctx.fillRect(-w/2, -h/2, w, h);
           ctx.globalCompositeOperation = 'source-over';
        }

        // 3. Bordo (Stroke)
        if (hasStroke) {
          ctx.strokeStyle = document.body.classList.contains('dark') ? '#FFF' : '#000';
          ctx.lineWidth = 1;
          // Stroke rect disegna al centro della linea, quindi combacia perfettamente se w/h sono giusti
          ctx.strokeRect(-w/2, -h/2, w, h);
        }

        // 4. Etichette Metadati
        if (showCategoryLabels) {
          // Posizione: Angolo in alto a sinistra, interno
          const pad = 4;
          const fontSize = 9;
          
          ctx.font = `${fontSize}px "Suisse Intl Mono", monospace`;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          
          const text = category;
          const textMetrics = ctx.measureText(text);
          const bgWidth = textMetrics.width + 4;
          const bgHeight = fontSize + 4;

          // Coordinate relative al centro del corpo:
          // Top-Left è -w/2, -h/2
          const labelX = -w/2; 
          const labelY = -h/2; 

          // Sfondo etichetta (piccolo rettangolo)
          ctx.fillStyle = document.body.classList.contains('dark') ? '#000' : '#FFF';
          ctx.fillRect(labelX, labelY, bgWidth, bgHeight);
          
          // Testo
          ctx.fillStyle = document.body.classList.contains('dark') ? '#FFF' : '#000';
          ctx.fillText(text, labelX + 2, labelY + 2);
        }

        ctx.restore();
      });
    };

    Matter.Events.on(render, 'afterRender', customRender);
    return () => {
        Matter.Events.off(render, 'afterRender', customRender);
    };

  }, [hasStroke, isBlackAndWhite, isOverlapMode, showCategoryLabels, isPhotoMode]);

  // 5. Gravity
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
      className={`absolute inset-0 z-10 transition-opacity duration-500 ${isBlackAndWhite ? 'grayscale' : ''}`}
    />
  );
};

export default CanvasArea;