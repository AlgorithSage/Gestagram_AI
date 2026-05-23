import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer } from 'react-konva';
import { Share2, Check } from 'lucide-react';
import { ActiveStrokeLayer } from './ActiveStrokeLayer';
import { useCanvasStore } from '../store/canvasStore';
import { ShapeRecognizer } from '../engine/shapeRecognizer';
import { ShapeLayer } from './canvas/ShapeLayer';
import { VoiceIndicator } from './canvas/VoiceIndicator';
import { handwritingEngine } from '../engine/handwritingEngine';
import { socket } from '../socket';

// Conditional lazy load of CameraPreview to optimize bundle size
const CameraPreview = React.lazy(() => import('./canvas/CameraPreview').then(m => ({ default: m.CameraPreview })));

interface Stroke {
  points: number[];
  color: string;
  tool: string;
  brushWidth: number;
}

export const CanvasOverlay: React.FC = () => {
  const [dimensions, setDimensions] = useState({ 
    width: window.innerWidth, 
    height: window.innerHeight 
  });

  const { 
    selectedTool, 
    brushColor, 
    brushWidth, 
    setTrackingConfidence, 
    shapes, 
    addShape, 
    updateShape, 
    setShapes, 
    clearShapes,
    setSelectedShapeId,
    setSelectedTool,
    cameraEnabled
  } = useCanvasStore();

  const [isDrawing, setIsDrawing] = useState(false);
  const [localActiveStroke, setLocalActiveStroke] = useState<number[]>([]);
  const [remoteActiveStrokes, setRemoteActiveStrokes] = useState<Record<string, Stroke>>({});
  const [copied, setCopied] = useState(false);

  // Performance throttling refs
  const lastEmitTime = useRef<number>(0);
  
  // Hanging line sweeping refs
  const remoteActiveTimestamps = useRef<Record<string, number>>({});

  // Sync state refs to prevent event stale closure bugs
  const activeStrokeRef = useRef<number[]>([]);
  const selectedToolRef = useRef(selectedTool);
  const brushColorRef = useRef(brushColor);
  const brushWidthRef = useRef(brushWidth);
  const shapesRef = useRef(shapes);

  useEffect(() => { activeStrokeRef.current = localActiveStroke; }, [localActiveStroke]);
  useEffect(() => { selectedToolRef.current = selectedTool; }, [selectedTool]);
  useEffect(() => { brushColorRef.current = brushColor; }, [brushColor]);
  useEffect(() => { brushWidthRef.current = brushWidth; }, [brushWidth]);
  useEffect(() => { shapesRef.current = shapes; }, [shapes]);

  // Parse board ID from URL hash or generate a highly secure random one
  const [boardId, setBoardId] = useState<string>(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) return hash;
    
    // Cryptographically secure board ID generator
    const array = new Uint32Array(3);
    window.crypto.getRandomValues(array);
    const secureId = Array.from(array, dec => dec.toString(36)).join('').substring(0, 10);
    
    window.location.hash = secureId;
    return secureId;
  });

  // Handle browser resizing
  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync boardId with URL hash shifts
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && hash !== boardId) {
        setBoardId(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [boardId]);

  // Connect to Socket.IO and subscribe to board updates
  useEffect(() => {
    socket.connect();

    const handleConnect = () => {
      // Initially lost until MediaPipe camera detects a hand
      setTrackingConfidence('lost');
      const userId = Math.random().toString(36).substring(7);
      socket.emit('join_board', { boardId, userId });
    };

    const handleDisconnect = () => {
      setTrackingConfidence('lost');
    };

    const handleConnectError = () => {
      setTrackingConfidence('lost');
      console.warn('Socket connection error occurred.');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.disconnect();
    };
  }, [boardId, setTrackingConfidence]);

  // Listen to remote updates and loaded whiteboard histories
  useEffect(() => {
    const handleStrokeUpdate = (data: {
      userId: string;
      points: number[];
      color: string;
      tool: string;
      brushWidth: number;
      isFinished: boolean;
    }) => {
      // Store timestamp of remote updates to sweep hanging lines later
      remoteActiveTimestamps.current[data.userId] = Date.now();

      if (data.isFinished) {
        // Remove from active remote map since drawing has ended
        setRemoteActiveStrokes(prev => {
          const next = { ...prev };
          delete next[data.userId];
          return next;
        });
        delete remoteActiveTimestamps.current[data.userId];
      } else {
        // Update active remote stroke path
        setRemoteActiveStrokes(prev => ({
          ...prev,
          [data.userId]: {
            points: data.points,
            color: data.color,
            tool: data.tool,
            brushWidth: data.brushWidth
          }
        }));
      }
    };

    const handleShapeAdded = (remoteShape: any) => {
      const existing = useCanvasStore.getState().shapes.find(s => s.id === remoteShape.id);
      if (existing) {
        updateShape(remoteShape.id, remoteShape);
      } else {
        addShape(remoteShape);
      }
    };

    const handleShapeLabelSynced = (data: { id: string; label: string }) => {
      updateShape(data.id, { label: data.label });
    };

    const handleLoadShapes = (history: any[]) => {
      setShapes(history);
    };

    const handleBoardCleared = () => {
      clearShapes();
      setRemoteActiveStrokes({});
    };

    socket.on('stroke_update', handleStrokeUpdate);
    socket.on('shape_added', handleShapeAdded);
    socket.on('shape_label_synced', handleShapeLabelSynced);
    socket.on('load_shapes', handleLoadShapes);
    socket.on('board_cleared', handleBoardCleared);

    return () => {
      socket.off('stroke_update', handleStrokeUpdate);
      socket.off('shape_added', handleShapeAdded);
      socket.off('shape_label_synced', handleShapeLabelSynced);
      socket.off('load_shapes', handleLoadShapes);
      socket.off('board_cleared', handleBoardCleared);
    };
  }, [addShape, updateShape, clearShapes, setShapes]);

  // Clean hanging inactive remote drawing paths (timeouts)
  useEffect(() => {
    const sweeper = setInterval(() => {
      const now = Date.now();
      let hasRemovals = false;
      
      setRemoteActiveStrokes(prev => {
        const next = { ...prev };
        for (const [userId, lastActive] of Object.entries(remoteActiveTimestamps.current)) {
          // If inactive for more than 3 seconds, wipe the remote stroke segment
          if (now - lastActive > 3000) {
            delete next[userId];
            delete remoteActiveTimestamps.current[userId];
            hasRemovals = true;
          }
        }
        return hasRemovals ? next : prev;
      });
    }, 2000);

    return () => clearInterval(sweeper);
  }, []);

  // Listen to local toolbar clear request
  useEffect(() => {
    const handleClearLocal = () => {
      clearShapes();
      setRemoteActiveStrokes({});
      socket.emit('clear_board', { boardId });
    };

    window.addEventListener('clear-canvas', handleClearLocal);
    return () => {
      window.removeEventListener('clear-canvas', handleClearLocal);
    };
  }, [boardId, clearShapes]);

  // Listen to local shape label sync events from voiceEngine
  useEffect(() => {
    const handleSyncLabel = (e: any) => {
      const { id, label } = e.detail;
      socket.emit('sync_shape_label', { boardId, id, label });
    };

    window.addEventListener('sync-shape-label', handleSyncLabel);
    return () => {
      window.removeEventListener('sync-shape-label', handleSyncLabel);
    };
  }, [boardId]);

  // Global Keyboard Hotkey Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip binding if focused on input or textarea elements
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key.toLowerCase();
      if (key === 'v') {
        setSelectedTool('select');
      } else if (key === 'p') {
        setSelectedTool('pen');
      } else if (key === 'e') {
        setSelectedTool('eraser');
      } else if (key === 't') {
        setSelectedTool('text');
      } else if (key === 'c') {
        window.dispatchEvent(new CustomEvent('clear-canvas'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSelectedTool]);

  // Simulated MediaPipe Virtual Gestures listeners
  useEffect(() => {
    const handleGestureDraw = (e: any) => {
      if (selectedToolRef.current === 'select') return;
      const { x, y } = e.detail;
      
      setIsDrawing(prev => {
        if (!prev) {
          // Virtual MouseDown
          setLocalActiveStroke([x, y]);
          socket.emit('draw_stroke', {
            boardId,
            points: [x, y],
            color: brushColorRef.current,
            tool: selectedToolRef.current,
            brushWidth: brushWidthRef.current,
            isFinished: false
          });
          return true;
        } else {
          // Virtual MouseMove
          const nextPoints = [...activeStrokeRef.current, x, y];
          setLocalActiveStroke(nextPoints);

          const now = Date.now();
          if (now - lastEmitTime.current > 30) {
            socket.emit('draw_stroke', {
              boardId,
              points: nextPoints,
              color: brushColorRef.current,
              tool: selectedToolRef.current,
              brushWidth: brushWidthRef.current,
              isFinished: false
            });
            lastEmitTime.current = now;
          }
          return true;
        }
      });
    };

    const handleGestureHover = () => {
      setIsDrawing(prev => {
        if (prev) {
          // Virtual MouseUp (Finished stroke)
          const activeStroke = activeStrokeRef.current;
          if (activeStroke.length >= 4) {
            if (selectedToolRef.current === 'eraser') {
              // Eraser intersection
              const erasedIds = new Set<string>();
              for (let i = 0; i < activeStroke.length; i += 2) {
                const ex = activeStroke[i];
                const ey = activeStroke[i+1];
                
                shapesRef.current.forEach(shape => {
                  const { x, y, width, height } = shape.bounds;
                  const pad = 12;
                  if (ex >= x - pad && ex <= x + width + pad && ey >= y - pad && ey <= y + height + pad) {
                    erasedIds.add(shape.id);
                  }
                });
              }

              if (erasedIds.size > 0) {
                const nextShapes = shapesRef.current.filter(s => !erasedIds.has(s.id));
                setShapes(nextShapes);
                socket.emit('clear_board', { boardId });
                nextShapes.forEach(s => socket.emit('add_shape', { boardId, shape: s }));
              }
            } else if (selectedToolRef.current === 'text') {
              // Scribble handwriting OCR
              handwritingEngine.recognize(activeStroke).then(transcript => {
                const bounds = ShapeRecognizer.recognize(activeStroke, brushColorRef.current, brushWidthRef.current).bounds;
                const textShape = {
                  id: 'shape_' + Math.random().toString(36).substring(2, 9),
                  type: 'text' as any,
                  confidence: 0.9,
                  color: brushColorRef.current,
                  brushWidth: brushWidthRef.current,
                  bounds,
                  controlPoints: [bounds.x + bounds.width / 2, bounds.y + bounds.height / 2],
                  label: transcript || 'Double click to edit text'
                };
                addShape(textShape);
                socket.emit('add_shape', { boardId, shape: textShape });
              });
            } else {
              // Snap shape
              const recognized = ShapeRecognizer.recognize(activeStroke, brushColorRef.current, brushWidthRef.current);
              addShape(recognized);
              socket.emit('add_shape', { boardId, shape: recognized });
            }

            // Sync finish
            socket.emit('draw_stroke', {
              boardId,
              points: activeStroke,
              color: brushColorRef.current,
              tool: selectedToolRef.current,
              brushWidth: brushWidthRef.current,
              isFinished: true
            });
          }
          setLocalActiveStroke([]);
        }
        return false;
      });
    };

    window.addEventListener('gesture-draw', handleGestureDraw);
    window.addEventListener('gesture-hover', handleGestureHover);
    return () => {
      window.removeEventListener('gesture-draw', handleGestureDraw);
      window.removeEventListener('gesture-hover', handleGestureHover);
    };
  }, [boardId, addShape, setShapes]);

  // Local drawing event handlers
  const handleMouseDown = (e: any) => {
    if (selectedTool === 'select') return;

    // Deselect selected shape if clicking on empty stage space
    if (e.target === e.target.getStage()) {
      setSelectedShapeId(null);
    }

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;

    setIsDrawing(true);
    const initialPoints = [pos.x, pos.y];
    setLocalActiveStroke(initialPoints);

    socket.emit('draw_stroke', {
      boardId,
      points: initialPoints,
      color: brushColor,
      tool: selectedTool,
      brushWidth,
      isFinished: false
    });
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing) return;

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;

    const nextPoints = [...localActiveStroke, pos.x, pos.y];
    setLocalActiveStroke(nextPoints);

    // High performance 30ms throttling block (shields websocket traffic)
    const now = Date.now();
    if (now - lastEmitTime.current > 30) {
      socket.emit('draw_stroke', {
        boardId,
        points: nextPoints,
        color: brushColor,
        tool: selectedTool,
        brushWidth,
        isFinished: false
      });
      lastEmitTime.current = now;
    }
  };

  const handleMouseUp = async () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (localActiveStroke.length >= 4) {
      if (selectedTool === 'eraser') {
        // Erase any shapes that intersect with the eraser stroke
        const erasedIds = new Set<string>();
        for (let i = 0; i < localActiveStroke.length; i += 2) {
          const ex = localActiveStroke[i];
          const ey = localActiveStroke[i+1];
          
          shapes.forEach(shape => {
            const { x, y, width, height } = shape.bounds;
            const pad = 12; // Generous collision padding for eraser
            if (ex >= x - pad && ex <= x + width + pad && ey >= y - pad && ey <= y + height + pad) {
              erasedIds.add(shape.id);
            }
          });
        }
        
        if (erasedIds.size > 0) {
          const nextShapes = shapes.filter(s => !erasedIds.has(s.id));
          setShapes(nextShapes);
          
          // Re-sync all remaining shapes
          socket.emit('clear_board', { boardId });
          nextShapes.forEach(s => {
            socket.emit('add_shape', { boardId, shape: s });
          });
        }
      } else if (selectedTool === 'text') {
        // Attempt handwriting recognition on the stroke
        const transcript = await handwritingEngine.recognize(localActiveStroke);
        const bounds = ShapeRecognizer.recognize(localActiveStroke, brushColor, brushWidth).bounds;
        const textShape = {
          id: 'shape_' + Math.random().toString(36).substring(2, 9),
          type: 'text' as any,
          confidence: 0.9,
          color: brushColor,
          brushWidth,
          bounds,
          controlPoints: [bounds.x + bounds.width / 2, bounds.y + bounds.height / 2],
          label: transcript || 'Double click to edit text'
        };
        addShape(textShape);
        socket.emit('add_shape', { boardId, shape: textShape });

        socket.emit('draw_stroke', {
          boardId,
          points: localActiveStroke,
          color: brushColor,
          tool: selectedTool,
          brushWidth,
          isFinished: true
        });
      } else {
        // Classify the stroke into a shape and commit
        const recognized = ShapeRecognizer.recognize(localActiveStroke, brushColor, brushWidth);
        addShape(recognized);

        // Sync shape to collaborative room
        socket.emit('add_shape', {
          boardId,
          shape: recognized
        });

        // Trigger isFinished to clean up drawings
        socket.emit('draw_stroke', {
          boardId,
          points: localActiveStroke,
          color: brushColor,
          tool: selectedTool,
          brushWidth,
          isFinished: true
        });
      }
    }

    setLocalActiveStroke([]);
  };

  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="absolute inset-0 z-10 pointer-events-auto">
      {/* Floating Smart Voice Engine Pill */}
      <VoiceIndicator />

      {/* Floating Camera Gesture Recognition Layer */}
      {cameraEnabled && (
        <React.Suspense fallback={<div className="absolute top-4 right-16 z-50 glass-card p-4">Loading Camera...</div>}>
          <CameraPreview />
        </React.Suspense>
      )}

      {/* Invite Collaboration Widget */}
      <div className="absolute top-4 left-44 z-50 flex items-center gap-2">
        <button
          onClick={handleShareLink}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold glass-btn-secondary hover:scale-105 transition-transform"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Link Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 text-gesta-dark" />
              <span>Share Board</span>
            </>
          )}
        </button>
        <span className="hidden sm:inline-block text-xs font-mono font-bold text-gesta-dark/60 bg-white/40 backdrop-blur-md border border-white/60 px-3 py-1.5 rounded-full shadow-xs">
          Room: {boardId}
        </span>
      </div>

      <Stage 
        width={dimensions.width} 
        height={dimensions.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
      >
        {/* Collaborative Idealized Shape Layer */}
        <ShapeLayer />

        {/* Live Active Drawing Layer */}
        <Layer>
          {localActiveStroke.length >= 2 && (
            <ActiveStrokeLayer 
              points={localActiveStroke}
              color={brushColor}
              tool={selectedTool}
              brushWidth={brushWidth}
            />
          )}

          {Object.entries(remoteActiveStrokes).map(([uId, stroke]) => (
            <ActiveStrokeLayer 
              key={`remote-${uId}`}
              points={stroke.points}
              color={stroke.color}
              tool={stroke.tool}
              brushWidth={stroke.brushWidth}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
};
