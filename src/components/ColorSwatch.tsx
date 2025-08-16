import { cn } from "@/lib/utils";

interface ColorSwatchProps {
  color: 'yellow' | 'green' | 'blue' | 'purple' | 'red';
  isActive: boolean;
  onClick: () => void;
}

const colorClasses = {
  yellow: 'bg-connections-yellow border-connections-yellow-dark',
  green: 'bg-connections-green border-connections-green-dark',
  blue: 'bg-connections-blue border-connections-blue-dark',
  purple: 'bg-connections-purple border-connections-purple-dark',
  red: 'bg-connections-red border-connections-red-dark',
};

export function ColorSwatch({ color, isActive, onClick }: ColorSwatchProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full h-6 rounded-md border-2 transition-all duration-200 transform",
        "hover:scale-105 active:scale-95",
        colorClasses[color],
        isActive 
          ? "ring-2 ring-foreground ring-offset-1 shadow-md" 
          : "shadow-sm hover:shadow-md"
      )}
      aria-label={`Select ${color} color`}
    />
  );
}