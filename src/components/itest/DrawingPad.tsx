"use client";

import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Eraser, Pencil, RotateCcw } from 'lucide-react';

export function DrawingPad({ onSave }: { onSave: (data: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#295CA3');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineCap = 'round';
    ctx.lineWidth = 3;
    ctx.strokeStyle = color;
  }, [color]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onSave(canvas.toDataURL());
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
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
    <div className="space-y-3 bg-white p-4 rounded-xl border shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-2">
          <Button 
            variant={color === '#295CA3' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setColor('#295CA3')}
          >
            <Pencil className="w-4 h-4 mr-2" /> Pen
          </Button>
          <Button 
            variant={color === '#FFFFFF' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setColor('#FFFFFF')}
          >
            <Eraser className="w-4 h-4 mr-2" /> Eraser
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={clear}>
          <RotateCcw className="w-4 h-4 mr-2" /> Clear
        </Button>
      </div>
      <canvas
        ref={canvasRef}
        width={600}
        height={300}
        onMouseDown={startDrawing}
        onMouseUp={stopDrawing}
        onMouseMove={draw}
        onTouchStart={startDrawing}
        onTouchEnd={stopDrawing}
        onTouchMove={draw}
        className="drawing-canvas w-full h-[300px] border-2 border-dashed rounded-lg bg-gray-50"
      />
      <p className="text-xs text-muted-foreground italic text-center">Use your pen or mouse to draw above</p>
    </div>
  );
}