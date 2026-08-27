import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Shield,
  Download,
  Crop,
  Undo2,
  Redo2,
  Hand,
  Check,
  X
} from 'lucide-react';
import { useToast } from '../ui/Toast';

interface ImageWorkbenchProps {
  imageDataUrl: string;
  onCropExtract?: (croppedDataUrl: string) => void;
  canUndoCrop?: boolean;
  canRedoCrop?: boolean;
  onUndoCrop?: () => void;
  onRedoCrop?: () => void;
}

type ToolMode = 'view' | 'redact-black' | 'redact-blur' | 'crop';

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'black' | 'blur';
}

export const ImageWorkbench: React.FC<ImageWorkbenchProps> = ({
  imageDataUrl,
  onCropExtract,
  canUndoCrop = false,
  canRedoCrop = false,
  onUndoCrop,
  onRedoCrop,
}) => {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Zoom & Pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [panStartOffset, setPanStartOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Tool mode
  const [mode, setMode] = useState<ToolMode>('view');

  // Redaction History Stack for Undo/Redo
  const [rectsHistory, setRectsHistory] = useState<Rect[][]>([[]]);
  const [rectHistoryIndex, setRectHistoryIndex] = useState(0);
  const currentRects = rectsHistory[rectHistoryIndex] || [];

  // Active drawing rect
  const [currentRect, setCurrentRect] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);

  // Load image when imageDataUrl changes
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageObj(img);
      setRectsHistory([[]]);
      setRectHistoryIndex(0);
      setZoom(1);
      setPan({ x: 0, y: 0 });
    };
    img.src = imageDataUrl;
  }, [imageDataUrl]);

  // Redraw canvas with image and redactions
  useEffect(() => {
    if (!imageObj || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = imageObj.naturalWidth;
    canvas.height = imageObj.naturalHeight;

    // Draw base image
    ctx.drawImage(imageObj, 0, 0);

    // Draw applied redactions
    for (const r of currentRects) {
      if (r.type === 'black') {
        ctx.fillStyle = '#000000';
        ctx.fillRect(r.x, r.y, r.w, r.h);
      } else if (r.type === 'blur') {
        ctx.save();
        ctx.filter = 'blur(14px)';
        ctx.drawImage(canvas, r.x, r.y, r.w, r.h, r.x, r.y, r.w, r.h);
        ctx.restore();
        ctx.fillStyle = 'rgba(220, 225, 235, 0.45)';
        ctx.fillRect(r.x, r.y, r.w, r.h);
      }
    }

    // Draw active drawing rect
    if (currentRect) {
      const x = Math.min(currentRect.startX, currentRect.currentX);
      const y = Math.min(currentRect.startY, currentRect.currentY);
      const w = Math.abs(currentRect.currentX - currentRect.startX);
      const h = Math.abs(currentRect.currentY - currentRect.startY);

      if (mode === 'crop') {
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = Math.max(3, canvas.width / 300);
        ctx.setLineDash([8, 8]);
        ctx.strokeRect(x, y, w, h);
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.18)';
        ctx.fillRect(x, y, w, h);
      } else {
        ctx.fillStyle = mode === 'redact-black' ? '#000000' : 'rgba(100, 116, 139, 0.85)';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#F43F5E';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
      }
    }
  }, [imageObj, currentRects, currentRect, mode]);

  // Handle Undo
  const handleUndo = useCallback(() => {
    if (rectHistoryIndex > 0) {
      setRectHistoryIndex((prev) => prev - 1);
      toast('Undone redaction', 'info');
    } else if (canUndoCrop && onUndoCrop) {
      onUndoCrop();
    }
  }, [rectHistoryIndex, canUndoCrop, onUndoCrop, toast]);

  // Handle Redo
  const handleRedo = useCallback(() => {
    if (rectHistoryIndex < rectsHistory.length - 1) {
      setRectHistoryIndex((prev) => prev + 1);
      toast('Redone redaction', 'info');
    } else if (canRedoCrop && onRedoCrop) {
      onRedoCrop();
    }
  }, [rectHistoryIndex, rectsHistory.length, canRedoCrop, onRedoCrop, toast]);

  // Keyboard Shortcuts (Space for Pan, Ctrl+Z for Undo, Ctrl+Y for Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Escape' && mode !== 'view') {
        setMode('view');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleUndo, handleRedo, mode]);

  // Wheel zoom with passive: false to prevent outer scrolling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      setZoom((prev) => {
        const next = Math.min(4, Math.max(0.3, prev * zoomFactor));
        return Number(next.toFixed(2));
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Middle click or Spacebar or View Mode triggers Pan
    if (mode === 'view' || isSpacePressed || e.button === 1) {
      setIsPanning(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setPanStartOffset({ ...pan });
      return;
    }

    // Left click in Draw/Crop mode
    if (e.button === 0) {
      const { x, y } = getCanvasCoordinates(e);
      setCurrentRect({ startX: x, startY: y, currentX: x, currentY: y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setPan({ x: panStartOffset.x + dx, y: panStartOffset.y + dy });
      return;
    }

    if (currentRect) {
      const { x, y } = getCanvasCoordinates(e);
      setCurrentRect((prev) => (prev ? { ...prev, currentX: x, currentY: y } : null));
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (!currentRect || !canvasRef.current) return;

    const x = Math.min(currentRect.startX, currentRect.currentX);
    const y = Math.min(currentRect.startY, currentRect.currentY);
    const w = Math.abs(currentRect.currentX - currentRect.startX);
    const h = Math.abs(currentRect.currentY - currentRect.startY);

    if (w > 5 && h > 5) {
      if (mode === 'crop' && onCropExtract) {
        // Extract sub-canvas
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = w;
        cropCanvas.height = h;
        const cropCtx = cropCanvas.getContext('2d');
        if (cropCtx && canvasRef.current) {
          cropCtx.drawImage(canvasRef.current, x, y, w, h, 0, 0, w, h);
          const croppedData = cropCanvas.toDataURL('image/png');
          onCropExtract(croppedData);
          toast('Area cropped, re-extracting...', 'info');
        }
        setMode('view');
      } else if (mode === 'redact-black' || mode === 'redact-blur') {
        const newRect: Rect = {
          x,
          y,
          w,
          h,
          type: mode === 'redact-black' ? 'black' : 'blur',
        };
        const nextRects = [...currentRects, newRect];
        const nextHistory = rectsHistory.slice(0, rectHistoryIndex + 1);
        nextHistory.push(nextRects);
        setRectsHistory(nextHistory);
        setRectHistoryIndex(nextHistory.length - 1);
        toast('Redaction applied.', 'info');
      }
    }

    setCurrentRect(null);
  };

  const handleDownloadRedacted = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `redacted_screenshot_${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
    toast('Redacted image downloaded.', 'success');
  };

  const clearRedactions = () => {
    if (currentRects.length === 0) return;
    const nextHistory = rectsHistory.slice(0, rectHistoryIndex + 1);
    nextHistory.push([]);
    setRectsHistory(nextHistory);
    setRectHistoryIndex(nextHistory.length - 1);
    toast('Redactions cleared.', 'info');
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const canUndo = rectHistoryIndex > 0 || canUndoCrop;
  const canRedo = rectHistoryIndex < rectsHistory.length - 1 || canRedoCrop;

  return (
    <div className="flex flex-col h-full bg-[#0E131F] border border-[#1E2638] rounded-xl overflow-hidden select-none">
      {/* Workbench Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#090D14] border-b border-[#1E2638] text-xs">
        {/* Tool Mode Selectors */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMode('view')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
              mode === 'view'
                ? 'bg-[#1E2638] text-white font-medium shadow-xs'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            title="Pan / Grab view (Drag to move)"
          >
            <Hand className="w-3.5 h-3.5 text-gray-300" />
            <span>Pan / Move</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('redact-black')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
              mode === 'redact-black'
                ? 'bg-rose-950/50 text-rose-200 border border-rose-500/40 font-medium'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            title="Redact sensitive balances / numbers"
          >
            <Shield className="w-3.5 h-3.5 text-rose-400" />
            <span>Redact</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('crop')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
              mode === 'crop'
                ? 'bg-cyan-950/50 text-cyan-200 border border-cyan-500/40 font-medium'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            title="Crop region to re-extract"
          >
            <Crop className="w-3.5 h-3.5 text-cyan-400" />
            <span>Crop</span>
          </button>
        </div>

        {/* Action Controls (Undo, Redo, Download, Zoom) */}
        <div className="flex items-center gap-1.5">
          {/* Undo Button */}
          <button
            type="button"
            onClick={handleUndo}
            disabled={!canUndo}
            className={`p-1.5 rounded transition-colors ${
              canUndo
                ? 'text-gray-300 hover:text-white hover:bg-[#1E2638]'
                : 'text-gray-600 cursor-not-allowed'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>

          {/* Redo Button */}
          <button
            type="button"
            onClick={handleRedo}
            disabled={!canRedo}
            className={`p-1.5 rounded transition-colors ${
              canRedo
                ? 'text-gray-300 hover:text-white hover:bg-[#1E2638]'
                : 'text-gray-600 cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>

          <div className="h-3.5 w-px bg-[#1E2638] mx-0.5" />

          {currentRects.length > 0 && (
            <>
              <button
                type="button"
                onClick={clearRedactions}
                className="text-[11px] text-gray-500 hover:text-gray-300 px-1"
                title="Clear all active redactions"
              >
                Reset ({currentRects.length})
              </button>

              <button
                type="button"
                onClick={handleDownloadRedacted}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#161D2C] hover:bg-[#1E2638] text-gray-200 text-[11px] border border-[#242F44] transition-colors"
                title="Download redacted screenshot"
              >
                <Download className="w-3 h-3" />
                <span>Export</span>
              </button>
            </>
          )}

          <div className="h-3.5 w-px bg-[#1E2638] mx-0.5" />

          {/* Zoom Out */}
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.3, Number((z - 0.15).toFixed(2))))}
            className="p-1 text-gray-400 hover:text-white rounded"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span
            className="text-[11px] font-mono text-gray-400 w-9 text-center cursor-pointer hover:text-white"
            onClick={handleResetView}
            title="Click to reset 100%"
          >
            {Math.round(zoom * 100)}%
          </span>

          {/* Zoom In */}
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(4, Number((z + 0.15).toFixed(2))))}
            className="p-1 text-gray-400 hover:text-white rounded"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          {/* Reset Zoom & Pan */}
          <button
            type="button"
            onClick={handleResetView}
            className="p-1 text-gray-400 hover:text-white rounded"
            title="Reset Zoom & Pan (100%)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Helper Banner */}
      {mode !== 'view' && (
        <div className="bg-[#121824] border-b border-[#1E2638] px-3 py-1.5 text-[11px] text-gray-300 flex items-center justify-between">
          <span>
            {mode === 'crop'
              ? 'Drag a rectangle over the target area to crop & re-extract.'
              : 'Drag a box to redact sensitive values (rekening/saldo).'}
          </span>
          <button
            type="button"
            onClick={() => setMode('view')}
            className="text-gray-400 hover:text-white underline text-[11px]"
          >
            Done
          </button>
        </div>
      )}

      {/* Canvas Viewport with Grab/Pan Capability */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`flex-1 relative overflow-hidden p-4 flex items-center justify-center bg-[#070A0F] min-h-[380px] max-h-[600px] ${
          mode === 'view' || isSpacePressed
            ? isPanning
              ? 'cursor-grabbing'
              : 'cursor-grab'
            : 'cursor-crosshair'
        }`}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 0.05s ease-out',
          }}
          className="inline-block relative select-none shrink-0"
        >
          <canvas
            ref={canvasRef}
            className="rounded-lg shadow-2xl border border-[#1E293B] block"
          />
        </div>

        {/* Floating Pan Hint when Zoomed */}
        {zoom > 1.2 && (
          <div className="absolute bottom-2.5 left-3 px-2 py-1 rounded bg-[#090D14]/85 border border-[#1E2638] text-[10px] text-gray-400 font-mono pointer-events-none backdrop-blur-xs">
            Hold Space + Drag to Pan
          </div>
        )}
      </div>
    </div>
  );
};
