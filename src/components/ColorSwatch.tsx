import { cn } from "@/lib/utils";

interface ColorSwatchProps {
  color: 'yellow' | 'green' | 'blue' | 'purple' | 'red';
  isActive: boolean;
  onClick: () => void;
}

const colorClasses = {
  yellow: {
    bg: 'bg-connections-yellow',
    borderUnselected: 'border-connections-yellow',
    borderSelected: 'border-connections-yellow-dark'
  },
  green: {
    bg: 'bg-connections-green',
    borderUnselected: 'border-connections-green',
    borderSelected: 'border-connections-green-dark'
  },
  blue: {
    bg: 'bg-connections-blue',
    borderUnselected: 'border-connections-blue',
    borderSelected: 'border-connections-blue-dark'
  },
  purple: {
    bg: 'bg-connections-purple',
    borderUnselected: 'border-connections-purple',
    borderSelected: 'border-connections-purple-dark'
  },
  red: {
    bg: 'bg-connections-red',
    borderUnselected: 'border-connections-red',
    borderSelected: 'border-connections-red-dark'
  },
};

export function ColorSwatch({ color, isActive, onClick }: ColorSwatchProps) {
  const colors = colorClasses[color];
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full h-8 rounded-md border-2 transition-all duration-200 transform",
        "hover:scale-105 active:scale-95",
        colors.bg,
        isActive ? colors.borderSelected : colors.borderUnselected,
        isActive 
          ? "shadow-md scale-105" 
          : "shadow-sm hover:shadow-md"
      )}
      aria-label={`Select ${color} color`}
    />
  );
}