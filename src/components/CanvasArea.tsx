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
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const wallsRef = useRef<{ ground: Matter.Body; left: Matter.Body; right: Matter.Body; ceiling: Matter.Body } | null>(null);
  
  const settingsRef = useRef({ 
    hasStroke, isBlackAndWhite, isPhotoMode, isOverlapMode, 
    showCategoryLabels, currentSize, gravityEnabled, isUiVisible, isMobile 
  });
  const lastSizeRef = useRef(currentSize);

  // Update settings ref
  useEffect(() => {
    settingsRef.current = { 
      hasStroke, isBlackAndWhite, isPhotoMode, isOverlapMode, 
      showCategoryLabels, currentSize, gravityEnabled, isUiVisible, isMobile 
    };
    
    if (engineRef.current) {
      engineRef.current.gravity.y = gravityEnabled ? 1 : 0;
    }

    // Scale existing bodies when size changes
    if (engineRef.current && currentSize !== lastSizeRef.current) {
      const scaleFactor = currentSize / lastSizeRef.current;
      const bodies = Matter.Composite.allBodies(engineRef.current.world);
      bodies.forEach(body => {
        if (!body.isStatic && (body as any).boxSize) {
          Matter.Body.scale(body, scaleFactor, scaleFactor);
          (body as any).boxSize *= scaleFactor;
        }
      });
      lastSizeRef.current = currentSize;
    }
  }, [hasStroke, isBlackAndWhite, isPhotoMode, isOverlapMode, showCategoryLabels, currentSize, gravityEnabled, isUiVisible, isMobile]);

  // Main setup
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const { Engine, Render, Runner, MouseConstraint, Mouse, Composite, Bodies, Events, Query } = Matter;

    // Get actual container size
    const getSize = () => ({
      width: container.clientWidth || window.innerWidth,
      height: container.clientHeight || window.innerHeight
    });

    const { width, height } = getSize();

    // Create engine
    const engine = Engine.create({ 
      gravity: { x: 0, y: settingsRef.current.gravityEnabled ? 1 : 0, scale: 0.001 } 
    });
    engineRef.current = engine;

    // Create renderer
    const render = Render.create({
      element: container,
      engine: engine,
      options: {
        width,
        height,
        background: 'transparent',
        wireframes: false,
        pixelRatio: Math.min(window.devicePixelRatio, 2),
      }
    });
    renderRef.current = render;

    // Run
    const runner = Runner.create();
    Runner.run(runner, engine);
    Render.run(render);

    // Calculate wall positions
    const getWallPositions = () => {
      const { width: w, height: h } = getSize();
      const mobile = w < 768;
      const headerH = 56;
      const toolbarH = (mobile && settingsRef.current.isUiVisible) ? 110 : 0;
      
      return {
        ground: { x: w / 2, y: h - toolbarH + 50 },
        ceiling: { x: w / 2, y: headerH - 50 },
        left: { x: -50, y: h / 2 },
        right: { x: w + 50, y: h / 2 },
        wallWidth: w * 3,
        wallHeight: h * 3
      };
    };

    // Create walls
    const wallOpts = { isStatic: true, friction: 1, restitution: 0.3, render: { visible: false } };
    const pos = getWallPositions();
    
    const ground = Bodies.rectangle(pos.ground.x, pos.ground.y, pos.wallWidth, 100, wallOpts);
    const ceiling = Bodies.rectangle(pos.ceiling.x, pos.ceiling.y, pos.wallWidth, 100, wallOpts);
    const leftWall = Bodies.rectangle(pos.left.x, pos.left.y, 100, pos.wallHeight, wallOpts);
    const rightWall = Bodies.rectangle(pos.right.x, pos.right.y, 100, pos.wallHeight, wallOpts);
    
    wallsRef.current = { ground, left: leftWall, right: rightWall, ceiling };
    Composite.add(engine.world, [ground, ceiling, leftWall, rightWall]);

    // Mouse constraint
    const mouse = Mouse.create(render.canvas);
    mouse.pixelRatio = render.options.pixelRatio || 1;

    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: 0.2, render: { visible: false } }
    });
    Composite.add(engine.world, mouseConstraint);

    // Track if mouse is over a body
    Events.on(mouseConstraint, 'mousemove', (e: any) => {
      const bodies = Composite.allBodies(engine.world).filter(b => !b.isStatic);
      const hit = Query.point(bodies, e.mouse.position);
      document.body.setAttribute('data-is-over-body', hit.length > 0 ? 'true' : 'false');
    });

    // Custom rendering
    Events.on(render, 'afterRender', () => {
      const ctx = render.context;
      const bodies = Composite.allBodies(engine.world);
      const { hasStroke, isBlackAndWhite, isPhotoMode, isOverlapMode, showCategoryLabels } = settingsRef.current;
      const isDark = document.body.classList.contains('dark');

      bodies.forEach(body => {
        const imgObj = (body as any).imageObj as ImageObject;
        if (body.isStatic || !imgObj) return;
        
        const { x, y } = body.position;
        const angle = body.angle;
        const size = (body as any).boxSize;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        // Blend mode for acetate effect
        if (isOverlapMode) {
          ctx.globalCompositeOperation = isDark ? 'screen' : 'multiply';
          ctx.globalAlpha = 0.85;
        } else {
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = 1.0;
        }

        // Grayscale filter
        if (isBlackAndWhite) ctx.filter = 'grayscale(100%)';

        // Draw image or color
        if (isPhotoMode) {
          const img = (body as any).cachedImage as HTMLImageElement;
          if (img && img.complete && img.naturalWidth > 0) {
            try {
              ctx.drawImage(img, -size/2, -size/2, size, size);
            } catch {
              ctx.fillStyle = imgObj.averageColor;
              ctx.fillRect(-size/2, -size/2, size, size);
            }
          } else {
            ctx.fillStyle = imgObj.averageColor;
            ctx.fillRect(-size/2, -size/2, size, size);
          }
        } else {
          ctx.fillStyle = imgObj.averageColor;
          ctx.fillRect(-size/2, -size/2, size, size);
        }

        ctx.filter = 'none';

        // Stroke
        if (hasStroke) {
          ctx.strokeStyle = isDark ? '#FFFFFF' : '#000000';
          ctx.lineWidth = 1;
          ctx.globalCompositeOperation = 'source-over';
          ctx.strokeRect(-size/2, -size/2, size, size);
        }

        // Category label
        if (showCategoryLabels) {
          ctx.fillStyle = isDark ? '#FFFFFF' : '#000000';
          ctx.font = '400 9px "Suisse Intl", sans-serif';
          ctx.textAlign = 'center';
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillText(imgObj.category, 0, size/2 + 12);
        }

        ctx.restore();
      });
    });

    // Resize handler using ResizeObserver
    const updateSize = () => {
      const { width: w, height: h } = getSize();
      
      render.canvas.width = w * (render.options.pixelRatio || 1);
      render.canvas.height = h * (render.options.pixelRatio || 1);
      render.canvas.style.width = `${w}px`;
      render.canvas.style.height = `${h}px`;
      render.options.width = w;
      render.options.height = h;

      // Update wall positions
      if (wallsRef.current) {
        const p = getWallPositions();
        Matter.Body.setPosition(wallsRef.current.ground, Matter.Vector.create(p.ground.x, p.ground.y));
        Matter.Body.setPosition(wallsRef.current.ceiling, Matter.Vector.create(p.ceiling.x, p.ceiling.y));
        Matter.Body.setPosition(wallsRef.current.left, Matter.Vector.create(p.left.x, p.left.y));
        Matter.Body.setPosition(wallsRef.current.right, Matter.Vector.create(p.right.x, p.right.y));
      }
    };

    // ResizeObserver for zoom and resize
    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    resizeObserver.observe(container);
    window.addEventListener('resize', updateSize);

    // Event handlers
    const handleAddImage = (e: any) => {
      const { image, size, x, y } = e.detail;
      const box = Bodies.rectangle(x, y, size, size, {
        frictionAir: 0.02,
        restitution: 0.1,
        render: { visible: false }
      });
      (box as any).imageObj = image;
      (box as any).boxSize = size;
      
      // Preload image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = image.url;
      (box as any).cachedImage = img;
      
      Composite.add(engine.world, box);
    };

    const handleChaos = () => {
      const bodies = Composite.allBodies(engine.world).filter(b => !b.isStatic);
      bodies.forEach(body => {
        const force = 0.05 * body.mass;
        Matter.Body.applyForce(body, body.position, {
          x: (Math.random() - 0.5) * force,
          y: (Math.random() - 0.5) * force
        });
        Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.3);
      });
    };

    const handleClear = () => {
      const toRemove = engine.world.bodies.filter(b => !b.isStatic);
      Composite.remove(engine.world, toRemove);
    };

    const handleSave = () => {
      const link = document.createElement('a');
      link.download = `1-1_${Date.now()}.png`;
      link.href = render.canvas.toDataURL('image/png');
      link.click();
    };

    window.addEventListener('add-image', handleAddImage);
    window.addEventListener('chaos-trigger', handleChaos);
    window.addEventListener('clear-canvas', handleClear);
    window.addEventListener('save-canvas', handleSave);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('add-image', handleAddImage);
      window.removeEventListener('chaos-trigger', handleChaos);
      window.removeEventListener('clear-canvas', handleClear);
      window.removeEventListener('save-canvas', handleSave);
      Render.stop(render);
      Runner.stop(runner);
      Engine.clear(engine);
      render.canvas.remove();
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 z-10 w-full h-full" />;
};

export default CanvasArea;
