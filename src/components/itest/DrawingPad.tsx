"use client";

import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Eraser, Pencil, RotateCcw, Palette, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const PRESET_COLORS = [
  { id: 'black', value: '#000000', label: 'Černá' },
  { id: 'blue', value: '#295CA3', label: 'Modrá' },
  { id: 'red', value: '#E11D48', label: 'Červená' },
  { id: 'green', value: '#10B981', label: 'Zelená' },
];

const SIZES = [
  { id: 'thin', value: 2, label: 'Tenký', iconSize: 4 },
  { id: 'medium', value: 5, label: 'Střední', iconSize: 8 },
  { id: 'thick', value: 12, label: 'Tlustý', iconSize: 12 },
];

export function DrawingPad({ 
  onSave, 
  backgroundImage, 
  initialDrawing 
}: { 
  onSave: (data: string) => void; 
  backgroundImage?: string;
  initialDrawing?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#295CA3');
  const [lineWidth, setLineWidth] = useState(3);
  const [isEraser, setIsEraser] = useState(false);

  // Initialize canvas and load background/initial drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const drawBackground = () => {
      if (backgroundImage) {
        const img = new Image();
        img.onload = () => {
          // Adjust canvas size to background image aspect ratio if possible
          // For now keep standard size but draw background centered/fitted
          const hRatio = canvas.width / img.width;
          const vRatio = canvas.height / img.height;
          const ratio = Math.min(hRatio, vRatio);
          const centerShift_x = (canvas.width - img.width * ratio) / 2;
          const centerShift_y = (canvas.height - img.height * ratio) / 2;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, img.width, img.height, centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);
          
          // Re-draw initial state if exists
          if (initialDrawing) {
            const drawImg = new Image();
            drawImg.onload = () => ctx.drawImage(drawImg, 0, 0);
            drawImg.src = initialDrawing;
          }
        };
        img.src = backgroundImage;
      } else if (initialDrawing) {
        const drawImg = new Image();
        drawImg.onload = () => ctx.drawImage(drawImg, 0, 0);
        drawImg.src = initialDrawing;
      }
    };

    drawBackground();
  }, [backgroundImage, initialDrawing]);

  // Update context when tools change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = isEraser ? '#FFFFFF' : color;
    ctx.lineWidth = isEraser ? 30 : lineWidth;
  }, [color, lineWidth, isEraser]);

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
      onSave(canvas.toDataURL('image/png'));
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (backgroundImage) {
      const img = new Image();
      img.onload = () => {
        const hRatio = canvas.width / img.width;
        const vRatio = canvas.height / img.height;
        const ratio = Math.min(hRatio, vRatio);
        const centerShift_x = (canvas.width - img.width * ratio) / 2;
        const centerShift_y = (canvas.height - img.height * ratio) / 2;
        ctx.drawImage(img, 0, 0, img.width, img.height, centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);
      };
      img.src = backgroundImage;
    }
    
    onSave('');
  };

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

      <div className="relative group overflow-hidden rounded-xl border-4 border-gray-50 bg-white shadow-lg">
        <canvas
          ref={canvasRef}
          width={800}
          height={backgroundImage ? 1100 : 400} // Taller for documents
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onMouseMove={draw}
          onTouchStart={(e) => { e.preventDefault(); startDrawing(e); }}
          onTouchEnd={(e) => { e.preventDefault(); stopDrawing(); }}
          onTouchMove={(e) => { e.preventDefault(); draw(e); }}
          className="drawing-canvas w-full cursor-crosshair touch-none bg-white"
        />
        <div className="absolute inset-0 pointer-events-none border-2 border-transparent group-hover:border-primary/20 transition-colors rounded-lg" />
      </div>
      
      <div className="flex justify-center">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full text-center">
          Piš přímo do dokumentu • Guma maže pouze tvůj zápis, ne podklad
        </p>
      </div>
    </div>
  );
}
