"use client";

import { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Eraser, Pencil, RotateCcw, Download } from 'lucide-react';

export function DrawingPad({ onSave }: { onSave: (data: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#295CA3');
  const [lineWidth, setLineWidth] = useState(3);

  // Initialize canvas with smooth rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
  }, [color, lineWidth]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
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
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
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
    onSave('');
  };

  return (
    <div className="space-y-4 bg-white p-6 rounded-2xl border-2 border-primary/10 shadow-inner">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
          <Button 
            variant={color === '#295CA3' ? 'default' : 'ghost'} 
            size="sm" 
            className="rounded-md"
            onClick={() => { setColor('#295CA3'); setLineWidth(3); }}
          >
            <Pencil className="w-4 h-4 mr-2" /> Pero
          </Button>
          <Button 
            variant={color === '#000000' ? 'default' : 'ghost'} 
            size="sm" 
            className="rounded-md"
            onClick={() => { setColor('#000000'); setLineWidth(5); }}
          >
            <Pencil className="w-4 h-4 mr-2" /> Fix
          </Button>
          <Button 
            variant={color === '#FFFFFF' ? 'default' : 'ghost'} 
            size="sm" 
            className="rounded-md"
            onClick={() => { setColor('#FFFFFF'); setLineWidth(20); }}
          >
            <Eraser className="w-4 h-4 mr-2" /> Guma
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={clear} className="rounded-full border-dashed">
            <RotateCcw className="w-4 h-4 mr-2" /> Vymazat plochu
          </Button>
        </div>
      </div>

      <div className="relative group overflow-hidden rounded-xl border-4 border-gray-50 bg-white">
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onMouseMove={draw}
          onTouchStart={(e) => { e.preventDefault(); startDrawing(e); }}
          onTouchEnd={(e) => { e.preventDefault(); stopDrawing(); }}
          onTouchMove={(e) => { e.preventDefault(); draw(e); }}
          className="drawing-canvas w-full h-[300px] md:h-[400px] cursor-crosshair touch-none"
        />
        <div className="absolute inset-0 pointer-events-none border-2 border-transparent group-hover:border-primary/20 transition-colors rounded-lg" />
      </div>
      
      <div className="flex justify-center">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full">
          Můžeš psát perem, prstem nebo myší
        </p>
      </div>
    </div>
  );
}
