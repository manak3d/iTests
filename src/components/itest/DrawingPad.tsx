
"use client";

import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Eraser, Pencil, RotateCcw, Palette, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const PRESET_COLORS = [
  { id: 'black', value: '#000000', label: 'Černá' },
  { id: 'blue', value: '#2563EB', label: 'Modrá' },
  { id: 'red', value: '#DC2626', label: 'Červená' },
  { id: 'green', value: '#16A34A', label: 'Zelená' },
  { id: 'yellow', value: '#CA8A04', label: 'Žlutá' },
  { id: 'orange', value: '#EA580C', label: 'Oranžová' },
  { id: 'purple', value: '#9333EA', label: 'Fialová' },
];

const SIZES = [
  { id: 'thin', value: 2, label: 'Tenký', iconSize: 4 },
  { id: 'medium', value: 5, label: 'Střední', iconSize: 8 },
  { id: 'thick', value: 12, label: 'Tlustý', iconSize: 12 },
];

export function DrawingPad({ 
  onSave, 
  backgroundImage, 
  initialDrawing,
  compact = false
}: { 
  onSave: (data: string) => void; 
  backgroundImage?: string;
  initialDrawing?: string;
  compact?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#295CA3');
  const [lineWidth, setLineWidth] = useState(compact ? 2 : 3);
  const [isEraser, setIsEraser] = useState(false);

  const canvasWidth = 800;
  const canvasHeight = compact ? 250 : (backgroundImage ? 1100 : 400);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const drawBackground = () => {
      // Vyčistíme canvas na plne transparentný
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (backgroundImage) {
        const img = new Image();
        img.onload = () => {
          bgImageRef.current = img; // Uložíme do referencie pre export
          
          if (initialDrawing) {
            const drawImg = new Image();
            drawImg.onload = () => ctx.drawImage(drawImg, 0, 0);
            drawImg.src = initialDrawing;
          }
        };
        img.src = backgroundImage;
      } else {
        if (initialDrawing) {
          const drawImg = new Image();
          drawImg.onload = () => ctx.drawImage(drawImg, 0, 0);
          drawImg.src = initialDrawing;
        }
      }
    };

    drawBackground();
  }, [backgroundImage, initialDrawing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = isEraser ? 'rgba(0,0,0,1)' : color;
    ctx.lineWidth = isEraser ? (compact ? 20 : 30) : lineWidth;
    ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
  }, [color, lineWidth, isEraser, compact]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = (e as TouchEvent).touches[0].clientX;
      clientY = (e as TouchEvent).touches[0].clientY;
    } else {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }

    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const { x, y } = getCoordinates(e.nativeEvent);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e.nativeEvent);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      // Vytvoríme pomocné offscreen canvas na zlúčenie kresby s pozadím na biely podklad
      const offscreen = document.createElement('canvas');
      offscreen.width = canvas.width;
      offscreen.height = canvas.height;
      const oCtx = offscreen.getContext('2d');
      if (oCtx) {
        // 1. Vyplníme na bielo
        oCtx.fillStyle = "#FFFFFF";
        oCtx.fillRect(0, 0, offscreen.width, offscreen.height);
        
        // 2. Ak máme pozadie, nakreslíme ho
        if (backgroundImage && bgImageRef.current) {
          const img = bgImageRef.current;
          const hRatio = offscreen.width / img.width;
          const vRatio = offscreen.height / img.height;
          const ratio = Math.min(hRatio, vRatio);
          const centerShift_x = (offscreen.width - img.width * ratio) / 2;
          const centerShift_y = (offscreen.height - img.height * ratio) / 2;
          oCtx.drawImage(img, 0, 0, img.width, img.height, centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);
        }
        
        // 3. Nakreslíme kresbu na vrch
        oCtx.drawImage(canvas, 0, 0);
        
        onSave(offscreen.toDataURL('image/jpeg', 0.6));
      } else {
        onSave(canvas.toDataURL('image/jpeg', 0.6));
      }
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onSave('');
  };

  // === COMPACT MODE (mini kreslicí plocha pro otázky) ===
  if (compact) {
    return (
      <div className="space-y-2 bg-gray-50 p-3 rounded-xl border border-dashed border-primary/20">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5 p-0.5 bg-white rounded-md border">
              <button
                type="button"
                onClick={() => setIsEraser(false)}
                className={cn(
                  "px-2 py-1 rounded text-xs font-medium transition-all",
                  !isEraser ? "bg-primary text-white shadow-sm" : "text-gray-500 hover:bg-gray-50"
                )}
              >
                <Pencil className="w-3 h-3 inline mr-1" />Pero
              </button>
              <button
                type="button"
                onClick={() => setIsEraser(true)}
                className={cn(
                  "px-2 py-1 rounded text-xs font-medium transition-all",
                  isEraser ? "bg-primary text-white shadow-sm" : "text-gray-500 hover:bg-gray-50"
                )}
              >
                <Eraser className="w-3 h-3 inline mr-1" />Guma
              </button>
            </div>
            <div className="flex items-center gap-1">
              <div className="flex gap-0.5 sm:gap-1">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { setColor(c.value); setIsEraser(false); }}
                    className={cn(
                      "w-4 h-4 sm:w-5 sm:h-5 rounded-full border transition-transform hover:scale-110",
                      color === c.value && !isEraser ? "border-primary scale-110 ring-1 ring-primary" : "border-gray-200"
                    )}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
              </div>
              <div className="relative group ml-0.5">
                <label className="cursor-pointer flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-gray-200 bg-white hover:border-primary hover:scale-110 transition-all shadow-sm">
                  <Palette className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-500" />
                  <input 
                    type="color" 
                    value={color} 
                    onChange={(e) => { setColor(e.target.value); setIsEraser(false); }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </label>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={clear}
            className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Smazat
          </button>
        </div>

        <div className="relative overflow-hidden rounded-lg border-2 border-gray-100 bg-white shadow-sm">
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            onMouseDown={startDrawing}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onMouseMove={draw}
            onTouchStart={(e) => { e.preventDefault(); startDrawing(e); }}
            onTouchEnd={(e) => { e.preventDefault(); stopDrawing(); }}
            onTouchMove={(e) => { e.preventDefault(); draw(e); }}
            className="w-full cursor-crosshair touch-none bg-white"
          />
        </div>
      </div>
    );
  }

  // === FULL MODE (plnohodnotná kreslicí plocha) ===
  return (
    <div className="space-y-4 bg-white p-6 rounded-2xl border-2 border-primary/10 shadow-inner">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
            <Button 
              variant={!isEraser ? 'default' : 'ghost'} 
              size="sm" 
              className="rounded-md h-9"
              onClick={() => setIsEraser(false)}
            >
              <Pencil className="w-4 h-4 mr-2" /> Pero
            </Button>
            <Button 
              variant={isEraser ? 'default' : 'ghost'} 
              size="sm" 
              className="rounded-md h-9"
              onClick={() => setIsEraser(true)}
            >
              <Eraser className="w-4 h-4 mr-2" /> Guma
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setColor(c.value); setIsEraser(false); }}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 active:scale-95",
                    color === c.value && !isEraser ? "border-primary scale-110 shadow-md" : "border-white"
                  )}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
            
            <div className="relative group">
              <label className="cursor-pointer flex items-center justify-center w-8 h-8 rounded-full border-2 border-gray-100 bg-white hover:border-primary transition-all shadow-sm">
                <Palette className="w-4 h-4 text-gray-500" />
                <input 
                  type="color" 
                  value={color} 
                  onChange={(e) => { setColor(e.target.value); setIsEraser(false); }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </label>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {backgroundImage && <div className="text-[10px] font-bold text-primary flex items-center gap-1"><ImageIcon className="w-3 h-3"/> DOKUMENT NA POZADÍ</div>}
          <div className="flex gap-2 items-center bg-gray-50 px-3 py-1 rounded-full border">
            <span className="text-[10px] font-bold text-muted-foreground uppercase mr-2">Tloušťka:</span>
            {SIZES.map((s) => (
              <button
                key={s.id}
                onClick={() => { setLineWidth(s.value); setIsEraser(false); }}
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full transition-all hover:bg-white",
                  lineWidth === s.value && !isEraser ? "bg-white border shadow-sm" : ""
                )}
                title={s.label}
              >
                <div 
                  className="rounded-full bg-slate-700" 
                  style={{ width: s.iconSize, height: s.iconSize }} 
                />
              </button>
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={clear} className="rounded-full border-dashed h-9">
            <RotateCcw className="w-4 h-4 mr-2" /> Vymazat
          </Button>
        </div>
      </div>

      <div className="relative group overflow-hidden rounded-xl border-4 border-gray-50 bg-white shadow-lg flex items-center justify-center" style={{ minHeight: backgroundImage ? undefined : canvasHeight }}>
        {backgroundImage && (
          <img 
            src={backgroundImage} 
            alt="Podklad" 
            className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none"
          />
        )}
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onMouseMove={draw}
          onTouchStart={(e) => { e.preventDefault(); startDrawing(e); }}
          onTouchEnd={(e) => { e.preventDefault(); stopDrawing(); }}
          onTouchMove={(e) => { e.preventDefault(); draw(e); }}
          className="drawing-canvas w-full cursor-crosshair touch-none bg-transparent relative z-10"
        />
        <div className="absolute inset-0 pointer-events-none border-2 border-transparent group-hover:border-primary/20 transition-colors rounded-lg z-20" />
      </div>
      
      <div className="flex justify-center">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full text-center">
          Piš přímo do dokumentu • Guma maže pouze tvůj zápis, ne podklad
        </p>
      </div>
    </div>
  );
}
