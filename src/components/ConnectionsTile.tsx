import { cn } from "@/lib/utils";

interface ConnectionsTileProps {
  word: string;
  markedColors: Array<'yellow' | 'green' | 'blue' | 'purple' | 'red'>;
  onClick: () => void;
}

const colorClasses = {
  yellow: 'hsl(var(--connections-yellow))',
  green: 'hsl(var(--connections-green))',
  blue: 'hsl(var(--connections-blue))',
  purple: 'hsl(var(--connections-purple))',
  red: 'hsl(var(--connections-red))',
};

const getBackgroundStyle = (colors: Array<'yellow' | 'green' | 'blue' | 'purple' | 'red'>) => {
  if (colors.length === 0) return {};
  if (colors.length === 1) {
    return { backgroundColor: colorClasses[colors[0]] };
  }
  if (colors.length === 2) {
    return {
      background: `linear-gradient(to bottom, ${colorClasses[colors[0]]} 50%, ${colorClasses[colors[1]]} 50%)`
    };
  }
  // For 3+ colors, split evenly
  const percentage = 100 / colors.length;
  const gradientStops = colors.map((color, index) => {
    const start = index * percentage;
    const end = (index + 1) * percentage;
    return `${colorClasses[color]} ${start}% ${end}%`;
  }).join(', ');
  
  return {
    background: `linear-gradient(to bottom, ${gradientStops})`
  };
};

export function ConnectionsTile({ word, markedColors, onClick }: ConnectionsTileProps) {
  const backgroundStyle = getBackgroundStyle(markedColors);
  const hasColors = markedColors.length > 0;
  
  return (
    <button
      onClick={onClick}
      style={backgroundStyle}
      className={cn(
        "relative border border-tile-border rounded-lg",
        "p-4 min-h-[80px] flex flex-col items-center justify-center",
        "active:scale-95 transition-all duration-300 ease-out",
        "font-medium text-sm md:text-base",
        "shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50",
        "transform hover:scale-[1.02]",
        !hasColors && "bg-tile-background hover:bg-tile-hover text-tile-text",
        hasColors && "text-foreground hover:opacity-90 animate-scale-in"
      )}
    >
      <span className="text-center leading-tight uppercase tracking-wide drop-shadow-sm">
        {word}
      </span>
    </button>
  );
}