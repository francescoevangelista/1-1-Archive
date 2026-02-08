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

  // 1. Setup Engine
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
    const wallOptions = { isStatic: true, render: { visible: false }, friction: 0.5 };

    const ground = Matter.Bodies.rectangle(width / 2, height + wallThick / 2 - 10, width, wallThick, { ...wallOptions, label: 'ground' });
    const leftWall = Matter.Bodies.rectangle(0 - wallThick / 2, height / 2, wallThick, height * 5, { ...wallOptions, label: 'wall' });
    const rightWall = Matter.Bodies.rectangle(width + wallThick / 2, height / 2, wallThick, height * 5, { ...wallOptions, label: 'wall' });
    const ceiling = Matter.Bodies.rectangle(width / 2, -wallThick * 4, width, wallThick, { ...wallOptions, label: 'ceiling' });

    wallsRef.current = { ground, leftWall, rightWall, ceiling };
    Matter.World.add(engine.world, [ground, leftWall, rightWall, ceiling]);

    const mouse = Matter.Mouse.create(render.canvas);
    mouse.pixelRatio = window.devicePixelRatio;
    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: { stiffness: 0.2, render: { visible: false } }
    });
    Matter.World.add(engine.world, mouseConstraint);

    // FIX: Blocca la generazione quando si clicca su un oggetto
    Matter.Events.on(mouseConstraint, 'mousedown', (event) => {
        const mousePosition = event.mouse.position;
        const bodies = Matter.Composite.allBodies(engine.world);
        const clickedBody = Matter.Query.point(bodies, mousePosition)[0];
        
        if (clickedBody && !clickedBody.isStatic) {
            // Stop propagation to prevent App.tsx from generating new image
            if (event.sourceEvents.mousedown) event.sourceEvents.mousedown.stopPropagation();
            if (event.sourceEvents.touchstart) event.sourceEvents.touchstart.stopPropagation();
        }
    });

    mouse.element.removeEventListener("mousewheel", (mouse as any).mousewheel);
    mouse.element.removeEventListener("DOMMouseScroll", (mouse as any).mousewheel);

    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);
    Matter.Render.run(render);

    engineRef.current = engine;
    renderRef.current = render;

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

  // 2. Pavimento
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

  // 3. Eventi
  useEffect(() => {
    const handleAddImage = (e: CustomEvent) => {
      if (!engineRef.current) return;
      const { image, size, x, y } = e.detail;
      const { id, url, category, averageColor } = image;

      const body = Matter.Bodies.rectangle(x, y, size, size, {
        chamfer: { radius: 0 },
        restitution: 0.4,
        friction: 0.1,
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

      (body as any).customData = { id, category, color: averageColor, w: size, h: size };
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
         Matter.Body.applyForce(b, b.position, { x: (Math.random() - 0.5) * force, y: (Math.random() - 0.8) * force });
       });
    };

    const handleSave = () => {
        if (!renderRef.current || !renderRef.current.canvas) return;
        try {
            const link = document.createElement('a');
            link.download = `capture-${Date.now()}.png`;
            link.href = renderRef.current.canvas.toDataURL('image/png');
            link.click();
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

  // 4. Render Custom (SOLUZIONE GRAFICA)
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

        // Se non è photo mode, disegniamo il rettangolo colorato
        if (!isPhotoMode) {
          ctx.fillStyle = isBlackAndWhite ? '#333' : color;
          ctx.fillRect(-w/2, -h/2, w, h);
        }
        
        // Acetate Mode (Disegna sopra solo se attivo)
        if (isOverlapMode) {
           ctx.globalCompositeOperation = 'multiply';
           ctx.fillStyle = document.body.classList.contains('dark') ? 'rgba(220, 210, 200, 0.3)' : 'rgba(40, 30, 20, 0.15)';
           ctx.fillRect(-w/2, -h/2, w, h);
           ctx.globalCompositeOperation = 'source-over';
        }

        // Bordo (Stroke)
        if (hasStroke) {
          ctx.strokeStyle = document.body.classList.contains('dark') ? '#FFF' : '#000';
          ctx.lineWidth = 1;
          ctx.strokeRect(-w/2, -h/2, w, h);
        }

        // Etichette (Top-Left interno)
        if (showCategoryLabels) {
          const fontSize = 9;
          ctx.font = `${fontSize}px "Suisse Intl Mono", monospace`;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          
          // Sfondo etichetta (piccolo rettangolo)
          const textWidth = ctx.measureText(category).width;
          const pad = 3;
          
          ctx.fillStyle = document.body.classList.contains('dark') ? '#000' : '#FFF';
          ctx.fillRect(-w/2, -h/2, textWidth + pad*2, fontSize + pad*2);
          
          // Testo
          ctx.fillStyle = document.body.classList.contains('dark') ? '#FFF' : '#000';
          ctx.fillText(category, -w/2 + pad, -h/2 + pad);
        }

        ctx.restore();
      });
    };

    Matter.Events.on(render, 'afterRender', customRender);
    return () => {
        Matter.Events.off(render, 'afterRender', customRender);
    };

  }, [hasStroke, isBlackAndWhite, isOverlapMode, showCategoryLabels, isPhotoMode]);

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