
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Move, Pen } from 'lucide-react';

interface SignatureFieldProps {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  signerName: string;
  signerEmail: string;
  status: 'pending' | 'signed' | 'rejected';
  onMove?: (id: string, x: number, y: number) => void;
  onResize?: (id: string, width: number, height: number) => void;
  onDelete?: (id: string) => void;
  isDraggable?: boolean;
  isResizable?: boolean;
}

export function SignatureField({
  id,
  x,
  y,
  width,
  height,
  signerName,
  signerEmail,
  status,
  onMove,
  onResize,
  onDelete,
  isDraggable = true,
  isResizable = true,
}: SignatureFieldProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const fieldRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDraggable) return;
    
    const rect = fieldRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !onMove) return;
    
    const container = fieldRef.current?.parentElement;
    if (container) {
      const containerRect = container.getBoundingClientRect();
      const newX = e.clientX - containerRect.left - dragOffset.x;
      const newY = e.clientY - containerRect.top - dragOffset.y;
      
      onMove(id, Math.max(0, newX), Math.max(0, newY));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  const getStatusColor = () => {
    switch (status) {
      case 'signed':
        return 'border-accent bg-accent/10';
      case 'rejected':
        return 'border-destructive bg-destructive/10';
      default:
        return 'border-warning bg-warning/10';
    }
  };

  return (
    <div
      ref={fieldRef}
      className={`absolute border-2 border-dashed ${getStatusColor()} rounded-md cursor-move select-none transition-all duration-200 hover:shadow-md`}
      style={{
        left: x,
        top: y,
        width,
        height,
        minWidth: 100,
        minHeight: 40,
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="relative w-full h-full">
        {/* Delete button */}
        {onDelete && (
          <Button
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 h-6 w-6 p-0"
            onClick={() => onDelete(id)}
          >
            <X className="h-3 w-3" />
          </Button>
        )}

        {/* Field content */}
        <div className="flex items-center justify-center h-full p-2">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Pen className="h-3 w-3 mr-1" />
              <span className="text-xs font-medium">Sign Here</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {signerName}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {signerEmail}
            </div>
          </div>
        </div>

        {/* Resize handle */}
        {isResizable && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary cursor-se-resize" />
        )}
      </div>
    </div>
  );
}
