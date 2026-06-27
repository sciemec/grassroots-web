'use client';

import { useRef, useState, useEffect } from 'react';
import { Pencil, Eraser, X, Check, Minus, Square } from 'lucide-react';
import { useClassroom } from './ClassroomProvider';

interface DrawingBoardProps {
  onClose: () => void;
}

export function DrawingBoard({ onClose }: DrawingBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { state, addAnnotation } = useClassroom();
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState('#f0b429');
  const [size, setSize] = useState(3);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    canvas.width = canvas.offsetWidth || 600;
    canvas.height = canvas.offsetHeight || 400;
    
    // White background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw pitch outline (light)
    ctx.strokeStyle = 'rgba(26, 92, 42, 0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
    
    // Center circle
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 30, 0, Math.PI * 2);
    ctx.stroke();
    
    // Center line
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 20);
    ctx.lineTo(canvas.width / 2, canvas.height - 20);
    ctx.stroke();
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    setIsDrawing(true);
    setLastX(x);
    setLastY(y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = tool === 'eraser' ? size * 3 : size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    
    setLastX(x);
    setLastY(y);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const saveAnnotation = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dataUrl = canvas.toDataURL();
    addAnnotation({
      type: 'drawing',
      data: dataUrl,
      timestamp: new Date(),
    });
    onClose();
  };

  if (!state.drawingMode) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-3 bg-[#1a5c2a] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pencil size={16} />
            <span className="font-bold text-sm">Tactical Drawing Board</span>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Canvas */}
        <div className="p-2 bg-gray-50">
          <canvas
            ref={canvasRef}
            className="w-full h-[400px] rounded-lg border border-gray-200 cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
        </div>

        {/* Tools */}
        <div className="p-3 border-t border-gray-200 flex flex-wrap items-center gap-2">
          {/* Tool buttons */}
          <div className="flex gap-1 border-r border-gray-200 pr-2">
            <button
              onClick={() => setTool('pen')}
              className={`p-1.5 rounded-lg transition-colors ${
                tool === 'pen' ? 'bg-[#1a5c2a] text-white' : 'hover:bg-gray-100'
              }`}
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => setTool('eraser')}
              className={`p-1.5 rounded-lg transition-colors ${
                tool === 'eraser' ? 'bg-[#1a5c2a] text-white' : 'hover:bg-gray-100'
              }`}
            >
              <Eraser size={14} />
            </button>
          </div>

          {/* Colors */}
          <div className="flex gap-1 border-r border-gray-200 pr-2">
            {['#f0b429', '#e53e3e', '#3182ce', '#38a169', '#000000'].map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full border-2 ${
                  color === c ? 'border-[#1a5c2a]' : 'border-gray-200'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          {/* Size */}
          <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
            <span className="text-[10px] text-gray-500">Size:</span>
            <input
              type="range"
              min={1}
              max={10}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-16"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-1 ml-auto">
            <button
              onClick={clearCanvas}
              className="px-2.5 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Clear
            </button>
            <button
              onClick={saveAnnotation}
              className="px-2.5 py-1 text-xs bg-[#1a5c2a] text-white hover:bg-[#0d3d1a] rounded-lg transition-colors flex items-center gap-1"
            >
              <Check size={12} />
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}