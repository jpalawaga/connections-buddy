import { cn } from "@/lib/utils";
import { useState, useRef } from "react";

type Color = 'yellow' | 'green' | 'blue' | 'purple' | 'red';

interface ColorSwatchProps {
  color: Color;
  isActive: boolean;
  count: number;
  onClick: () => void;
  onColorSwap: (fromColor: Color, toColor: Color) => void;
}

const colorClasses = {
  yellow: {
    bg: 'bg-connections-yellow',
    borderUnselected: 'border-connections-yellow',
    borderSelected: 'border-connections-yellow-dark',
    text: 'text-connections-yellow-text'
  },
  green: {
    bg: 'bg-connections-green',
    borderUnselected: 'border-connections-green',
    borderSelected: 'border-connections-green-dark',
    text: 'text-connections-green-text'
  },
  blue: {
    bg: 'bg-connections-blue',
    borderUnselected: 'border-connections-blue',
    borderSelected: 'border-connections-blue-dark',
    text: 'text-connections-blue-text'
  },
  purple: {
    bg: 'bg-connections-purple',
    borderUnselected: 'border-connections-purple',
    borderSelected: 'border-connections-purple-dark',
    text: 'text-connections-purple-text'
  },
  red: {
    bg: 'bg-connections-red',
    borderUnselected: 'border-connections-red',
    borderSelected: 'border-connections-red-dark',
    text: 'text-connections-red-text'
  },
};

export function ColorSwatch({ color, isActive, count, onClick, onColorSwap }: ColorSwatchProps) {
  const colors = colorClasses[color];
  const [isDragging, setIsDragging] = useState(false);
  const [isDropTarget, setIsDropTarget] = useState(false);
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only start drag after a long press 1100ms)
    dragTimeoutRef.current = setTimeout(() => {
      setIsDragging(true);
      e.preventDefault();
    }, 100);
  };
  
  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
      dragTimeoutRef.current = null;
    }
    
    if (!isDragging) {
      // Short press - normal click behavior
      onClick();
    }
    
    setIsDragging(false);
  };
  
  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragTimeoutRef.current) {
      // Cancel drag if user moves before long press completes
      clearTimeout(dragTimeoutRef.current);
      dragTimeoutRef.current = null;
    }
  };
  
  const handlePointerEnter = (e: React.PointerEvent) => {
    // Check if something is being dragged over this swatch
    if (e.pointerType !== 'mouse' && e.pressure > 0) {
      setIsDropTarget(true);
    }
  };
  
  const handlePointerLeave = () => {
    setIsDropTarget(false);
  };
  
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', color);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDropTarget(true);
  };
  
  const handleDragLeave = () => {
    setIsDropTarget(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const draggedColor = e.dataTransfer.getData('text/plain') as Color;
    if (draggedColor && draggedColor !== color) {
      onColorSwap(draggedColor, color);
    }
    setIsDropTarget(false);
  };
  
  return (
    <button
      onClick={onClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      draggable={isDragging}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "w-full h-8 rounded-md border-2 transition-all duration-200 transform",
        "touch-manipulation select-none",
        "connections-swatch relative", // Custom class for mobile-safe interactions
        colors.bg,
        isActive ? colors.borderSelected : colors.borderUnselected,
        isActive 
          ? "shadow-md scale-105" 
          : "shadow-sm",
        isDragging && "scale-110 shadow-lg opacity-80 z-10",
        isDropTarget && "ring-2 ring-white ring-opacity-50 scale-110"
      )}
      aria-label={`Select ${color} color. Press and hold to drag and swap colors.`}
      style={{
        cursor: isDragging ? 'grabbing' : 'pointer'
      }}
    >
      {count > 0 && (
        <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${colors.text}`}>
          {count}
        </span>
      )}
    </button>
  );
}