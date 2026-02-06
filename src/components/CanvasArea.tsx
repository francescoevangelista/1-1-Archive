import React, { useEffect, useRef } from 'react';
import Matter from 'matter-js';
import { ImageObject } from '../types';

interface CanvasAreaProps {
  hasStroke: boolean;
  isBlackAndWhite: boolean;
  isPhotoMode: boolean;
  isOverlapMode: boolean;
  showCategoryLabels: boolean;
  currentSize: number;
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
  currentSize,
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

    // Create Walls
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

    // Runner
    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);
    Matter.Render.run(render);

    engineRef.current = engine;
    renderRef.current = render;

    // Mouse control
    const mouse = Matter.Mouse.create(render.canvas);
    mouse.pixelRatio = window.devicePixelRatio;
    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: { stiffness: 0.2, render: { visible: false } }
    });
    Matter.World.add(engine.world, mouseConstraint);

    // Disable mouse scrolling interaction
    mouse.element.removeEventListener("mousewheel", (mouse as any).mousewheel);
    mouse.element.removeEventListener("DOMMouseScroll", (mouse as any).mousewheel);

    // Resize handler
    const handleResize = () => {
      render.canvas.width = window.innerWidth;
      render.canvas.height = window.innerHeight;
      
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
    };
  }, []);

  // 2. PAVIMENTO DINAMICO (Logica Toolbar Mobile)
  useEffect(() => {
    if (!wallsRef.current || !engineRef.current) return;
    
    const height = window.innerHeight;
    const width = window.innerWidth;
    const wallThick = 60;
    
    // Se siamo su mobile e la UI è visibile, il pavimento sale
    // Stimiamo l'altezza della toolbar aperta a circa 350px (o regolala a piacere)
    // Se è chiusa, c'è la barra piccola (es. 60px), se vuoi che le immagini stiano sopra la barra piccola usa 60, altrimenti 0
    const toolbarHeight = isMobile && isUiVisible ? 360 : (isMobile ? 60 : 0); 
    
    // Nuova Y del pavimento
    const newY = height - toolbarHeight + (wallThick / 2);

    // Spostiamo il pavimento
    Matter.Body.setPosition(wallsRef.current.ground, {
      x: width / 2,
      y: newY
    });

    // SVEGLIAMO I CORPI!
    // Se il pavimento si muove, i corpi che dormono (isSleeping) devono svegliarsi per cadere/adattarsi
    Matter.Composite.allBodies(engineRef.current.world).forEach((body) => {
      if (!body.isStatic) {
        Matter.Sleeping.set(body, false);
      }
    });

  }, [isUiVisible, isMobile]); // Si attiva quando apri/chiudi la UI

  // 3. Handle Add Image Event
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
          sprite: {
            texture: url,
            xScale: size / 400, // Assuming 400px placeholder logic size
            yScale: size / 400
          }
        },
        label: category // Store category in label for simplicity
      });

      // Custom properties for rendering loop
      (body as any).customData = {
        id,
        url,
        category,
        color: averageColor,
        w: size,
        h: size
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
           x: (Math.random() - 0.5) * 0.5, 
           y: (Math.random() - 0.5) * 0.5 
         });
       });
    };

    window.addEventListener('add-image', handleAddImage as EventListener);
    window.addEventListener('clear-canvas', handleClear);
    window.addEventListener('chaos-trigger', handleChaos);
    
    return () => {
      window.removeEventListener('add-image', handleAddImage as EventListener);
      window.removeEventListener('clear-canvas', handleClear);
      window.removeEventListener('chaos-trigger', handleChaos);
    };
  }, []);

  // 4. Custom Render Loop (Sync React State visuals with Matter bodies)
  useEffect(() => {
    if (!renderRef.current) return;
    const render = renderRef.current;
    
    // Hook into Matter.js render to draw custom things (borders, labels)
    Matter.Events.on(render, 'afterRender', () => {
      const ctx = render.context;
      const bodies = Array.from(bodiesMapRef.current.values());

      bodies.forEach(body => {
        const { x, y } = body.position;
        const { w, h, category, color, url } = (body as any).customData;
        const angle = body.angle;

        ctx.translate(x, y);
        ctx.rotate(angle);

        // A. Draw Image/Color box
        if (isPhotoMode) {
           // Matter.Render handles the sprite automatically if configured, 
           // but we can override or enhance here if needed.
           // For now, sprite is handled by Matter engine setup above.
           // Just need to handle "BW" or filter effects if not using pure CSS on canvas
        } else {
          // Color Mode
          ctx.fillStyle = isBlackAndWhite ? '#888' : color;
          ctx.fillRect(-w/2, -h/2, w, h);
        }
        
        // B. Draw Border
        if (hasStroke) {
          ctx.strokeStyle = document.body.classList.contains('dark') ? '#FFF' : '#000';
          ctx.lineWidth = 1;
          ctx.strokeRect(-w/2, -h/2, w, h);
        }

        // C. Draw Overlap Effect (Acetate)
        if (isOverlapMode) {
          ctx.globalCompositeOperation = document.body.classList.contains('dark') ? 'screen' : 'multiply';
          ctx.fillStyle = document.body.classList.contains('dark') ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
          ctx.fillRect(-w/2, -h/2, w, h);
          ctx.globalCompositeOperation = 'source-over';
        }

        // D. Draw Category Label
        if (showCategoryLabels) {
          ctx.fillStyle = document.body.classList.contains('dark') ? '#FFF' : '#000';
          ctx.font = '10px "Suisse Intl"';
          ctx.textAlign = 'center';
          ctx.fillText(category, 0, -h/2 + 12);
        }

        ctx.rotate(-angle);
        ctx.translate(-x, -y);
      });
    });
  }, [hasStroke, isBlackAndWhite, isOverlapMode, showCategoryLabels, isPhotoMode]);

  // 5. Gravity Toggle
  useEffect(() => {
    if (!engineRef.current) return;
    engineRef.current.world.gravity.y = gravityEnabled ? 1 : 0;
    // Wake up bodies
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