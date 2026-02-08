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
    // Aumentiamo la stiffness per una presa più reattiva
    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: { stiffness: 0.7, damping: 0.1, render: { visible: false } }
    });
    Matter.World.add(engine.world, mouseConstraint);

    // Fix eventi scroll
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
    const toolbarHeight = isMobile && isUiVisible ? 360 : (isMobile ? 60 : 0); 
    const newY = height - toolbarHeight + (wallThick / 2);

    Matter.Body.setPosition(wallsRef.current.ground, { x: width / 2, y: newY });
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

      // Creazione corpo fisico ottimizzata per trascinamento
      const body = Matter.Bodies.rectangle(x, y, size, size, {
        chamfer: { radius: 2 }, // Leggero smusso per evitare incastri
        restitution: 0.4, // Rimbalzo
        friction: 0.1,    // Basso attrito per scivolare
        frictionAir: 0.01, // Bassa resistenza all'aria
        density: 0.001,    // Leggeri per essere spostati facilmente
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
         // Forza più intensa e casuale
         const forceMagnitude = 0.05 * b.mass;
         Matter.Body.applyForce(b, b.position, { 
           x: (Math.random() - 0.5) * forceMagnitude,
           y: (Math.random() - 0.8) * forceMagnitude // Spinta verso l'alto
         });
       });
    };

    const handleSave = () => {
        if (!renderRef.current || !renderRef.current.canvas) return;
        try {
            const link = document.createElement('a');
            link.download = `1-1-archivio-capture.png`;
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

  // 4. Custom Render Loop (CORRETTO)
  useEffect(() => {
    if (!renderRef.current) return;
    const render = renderRef.current;
    
    const customRender = () => {
      const ctx = render.context;
      if (!ctx) return;
      const bodies = Array.from(bodiesMapRef.current.values());

      bodies.forEach(body => {
        // Se è in PhotoMode, Matter disegna lo sprite. Noi disegniamo solo gli extra sopra.
        // Se NON è PhotoMode, Matter non disegna nulla (visible: false) e noi disegniamo il colore.
        const { x, y } = body.position;
        const customData = (body as any).customData;
        if (!customData) return;
        
        const { w, h, category, color } = customData;
        const angle = body.angle;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        // 1. Disegno Colore Solido (se non è photo mode)
        if (!isPhotoMode) {
          ctx.fillStyle = isBlackAndWhite ? '#333' : color; // Grigio scuro invece di #888
          ctx.fillRect(-w/2, -h/2, w, h);
        }
        
        // 2. Effetto Acetato (Overlap) - Disegnato SOPRA l'immagine o il colore
        if (isOverlapMode) {
           ctx.globalCompositeOperation = 'multiply'; // Multiply funziona meglio per effetto "lastra"
           // Colore leggermente caldo per l'acetato
           ctx.fillStyle = document.body.classList.contains('dark') ? 'rgba(220, 210, 200, 0.3)' : 'rgba(40, 30, 20, 0.3)';
           ctx.fillRect(-w/2, -h/2, w, h);
           ctx.globalCompositeOperation = 'source-over';
        }

        // 3. Bordo (Stroke) - Disegnato PER ULTIMO per stare sopra a tutto
        if (hasStroke) {
          ctx.strokeStyle = document.body.classList.contains('dark') ? '#FFF' : '#000';
          ctx.lineWidth = 1; 
          // Disegna esattamente sul bordo del rettangolo riempito
          ctx.strokeRect(-w/2, -h/2, w, h);
        }

        // 4. Etichette Metadati (Posizionate nell'angolo in alto a sinistra)
        if (showCategoryLabels) {
          const labelW = 28;
          const labelH = 12;
          // Sfondo etichetta (angolo top-left: -w/2, -h/2)
          ctx.fillStyle = document.body.classList.contains('dark') ? '#000' : '#FFF';
          ctx.fillRect(-w/2, -h/2, labelW, labelH);
          
          // Testo etichetta
          ctx.fillStyle = document.body.classList.contains('dark') ? '#FFF' : '#000';
          // Font monospaziato per look tecnico
          ctx.font = '9px "Suisse Intl Mono", monospace'; 
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          // Centro del rettangolino
          ctx.fillText(category, -w/2 + labelW/2, -h/2 + labelH/2 + 0.5);
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
    // Gravità più forte per far cadere le cose con decisione
    engineRef.current.world.gravity.y = gravityEnabled ? 1.5 : 0;
    Matter.Composite.allBodies(engineRef.current.world).forEach((body) => {
       if (!body.isStatic) Matter.Sleeping.set(body, false);
    });
  }, [gravityEnabled]);

  return (
    <div 
      ref={sceneRef} 
      // Rimosso pointer-events-none per permettere l'interazione con il canvas
      className={`absolute inset-0 z-10 transition-opacity duration-500
        ${isBlackAndWhite ? 'grayscale' : ''}
      `}
    />
  );
};

export default CanvasArea;