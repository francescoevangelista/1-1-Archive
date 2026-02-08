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
  // Aggiungiamo currentSize come prop se vogliamo reagire direttamente, 
  // ma useremo un evento custom per performance migliori
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

    const wallThick = 60;
    const width = window.innerWidth;
    const height = window.innerHeight;

    const ground = Matter.Bodies.rectangle(width / 2, height + wallThick / 2 - 10, width, wallThick, { 
      isStatic: true, label: 'ground', render: { visible: false } 
    });
    const leftWall = Matter.Bodies.rectangle(0 - wallThick / 2, height / 2, wallThick, height * 5, { 
      isStatic: true, label: 'wall', render: { visible: false } 
    });
    const rightWall = Matter.Bodies.rectangle(width + wallThick / 2, height / 2, wallThick, height * 5, { 
      isStatic: true, label: 'wall', render: { visible: false } 
    });
    const ceiling = Matter.Bodies.rectangle(width / 2, -wallThick * 4, width, wallThick, { 
      isStatic: true, label: 'ceiling', render: { visible: false } 
    });

    wallsRef.current = { ground, leftWall, rightWall, ceiling };
    Matter.World.add(engine.world, [ground, leftWall, rightWall, ceiling]);

    const mouse = Matter.Mouse.create(render.canvas);
    mouse.pixelRatio = window.devicePixelRatio;
    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: { stiffness: 0.2, render: { visible: false } }
    });
    Matter.World.add(engine.world, mouseConstraint);

    mouse.element.removeEventListener("mousewheel", (mouse as any).mousewheel);
    mouse.element.removeEventListener("DOMMouseScroll", (mouse as any).mousewheel);

    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);
    Matter.Render.run(render);

    engineRef.current = engine;
    renderRef.current = render;

    const handleResize = () => {
      if (!render.canvas) return;
      render.canvas.width = window.innerWidth * window.devicePixelRatio;
      render.canvas.height = window.innerHeight * window.devicePixelRatio;
      render.options.width = window.innerWidth;
      render.options.height = window.innerHeight;
      
      if (wallsRef.current) {
        Matter.Body.setPosition(wallsRef.current.rightWall, { x: window.innerWidth + 30, y: window.innerHeight / 2 });
        Matter.Body.setPosition(wallsRef.current.ground, { x: window.innerWidth / 2, y: window.innerHeight + 30 });
      }
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
    
    const toolbarHeight = isMobile && isUiVisible ? 360 : (isMobile ? 60 : 0); 
    const newY = height - toolbarHeight + (wallThick / 2);

    Matter.Body.setPosition(wallsRef.current.ground, {
      x: width / 2,
      y: newY
    });

    Matter.Composite.allBodies(engineRef.current.world).forEach((body) => {
      if (!body.isStatic) {
        Matter.Sleeping.set(body, false);
      }
    });

  }, [isUiVisible, isMobile]);

  // 3. Gestione Eventi (Add, Clear, Chaos, Save, RESIZE)
  useEffect(() => {
    const handleAddImage = (e: CustomEvent) => {
      if (!engineRef.current) return;
      const { image, size, x, y } = e.detail;
      const { id, url, category, averageColor } = image;

      const body = Matter.Bodies.rectangle(x, y, size, size, {
        chamfer: { radius: 0 },
        restitution: 0.5,
        friction: 0.5,
        frictionAir: 0.02,
        render: {
            visible: isPhotoMode, 
            sprite: {
                texture: url,
                xScale: size / 400,
                yScale: size / 400
            }
        },
        label: category
      });

      (body as any).customData = {
        id,
        category,
        color: averageColor,
        w: size,
        h: size,
        baseScale: size / 400 // Salviamo la scala base
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
         Matter.Body.applyForce(b, b.position, { 
           x: (Math.random() - 0.5) * 0.5 * b.mass,
           y: (Math.random() - 0.5) * 0.5 * b.mass
         });
       });
    };

    const handleSave = () => {
        if (!renderRef.current || !renderRef.current.canvas) return;
        try {
            const link = document.createElement('a');
            link.download = `1-1-archivio-${new Date().toISOString().slice(0,10)}.png`;
            link.href = renderRef.current.canvas.toDataURL('image/png');
            link.click();
            link.remove();
        } catch (err) {
            console.error("Errore save:", err);
        }
    };

    // NUOVO: Gestione Resize in tempo reale (Issue 1)
    const handleResizeBodies = (e: CustomEvent) => {
        if (!engineRef.current) return;
        const newSize = e.detail;
        const bodies = Array.from(bodiesMapRef.current.values());
        
        bodies.forEach(body => {
            const currentW = (body as any).customData.w;
            const scaleFactor = newSize / currentW;
            
            // Scaliamo il corpo fisico
            Matter.Body.scale(body, scaleFactor, scaleFactor);
            
            // Aggiorniamo i dati custom
            (body as any).customData.w = newSize;
            (body as any).customData.h = newSize;
            
            // Aggiorniamo lo sprite
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

  // 4. Custom Render Loop
  useEffect(() => {
    if (!renderRef.current) return;
    const render = renderRef.current;
    
    const customRender = () => {
      const ctx = render.context;
      if (!ctx) return;
      const bodies = Array.from(bodiesMapRef.current.values());

      bodies.forEach(body => {
        if (!body.render.visible && isPhotoMode) return;

        const { x, y } = body.position;
        const customData = (body as any).customData;
        if (!customData) return;
        
        const { w, h, category, color } = customData;
        const angle = body.angle;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        // Photo Mode Logic
        if (!isPhotoMode) {
          ctx.fillStyle = isBlackAndWhite ? '#888' : color;
          ctx.fillRect(-w/2, -h/2, w, h);
        }
        
        // Acetate / Overlap Logic
        if (isOverlapMode && isPhotoMode) {
           ctx.globalCompositeOperation = document.body.classList.contains('dark') ? 'screen' : 'multiply';
           ctx.fillStyle = document.body.classList.contains('dark') ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
           ctx.fillRect(-w/2, -h/2, w, h);
           ctx.globalCompositeOperation = 'source-over';
        }

        // Stroke Logic
        if (hasStroke) {
          ctx.strokeStyle = document.body.classList.contains('dark') ? '#FFF' : '#000';
          ctx.lineWidth = 1; // Bordo sottile elegante
          ctx.strokeRect(-w/2, -h/2, w, h);
        }

        // Metadata Labels Logic (Top-Left corner of the image)
        if (showCategoryLabels) {
          // Disegna piccolo rettangolo background
          ctx.fillStyle = document.body.classList.contains('dark') ? '#000' : '#FFF';
          const labelW = 24; // Larghezza fissa piccola
          const labelH = 10;
          
          // Posizionato esattamente all'angolo in alto a sinistra dell'immagine
          ctx.fillRect(-w/2, -h/2, labelW, labelH);
          
          // Testo
          ctx.fillStyle = document.body.classList.contains('dark') ? '#FFF' : '#000';
          ctx.font = '8px "Suisse Intl"'; // Font molto piccolo e tecnico
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(category, -w/2 + labelW/2, -h/2 + labelH/2);
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
    engineRef.current.world.gravity.y = gravityEnabled ? 1 : 0;
    Matter.Composite.allBodies(engineRef.current.world).forEach((body) => {
       if (!body.isStatic) Matter.Sleeping.set(body, false);
    });
  }, [gravityEnabled]);

  return (
    <div 
      ref={sceneRef} 
      className={`absolute inset-0 z-10 pointer-events-none transition-opacity duration-500
        ${isBlackAndWhite ? 'grayscale' : ''}
      `}
    />
  );
};

export default CanvasArea;