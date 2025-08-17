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
  
  // Smart text sizing based on estimated character width
  const getTextSizeStyle = (word: string) => {
    // More accurate character width estimation
    const getCharWidth = (char: string) => {
      // Wide characters
      if ('MWQG'.includes(char)) return 1.2;
      // Narrow characters  
      if ('ILJlij1'.includes(char)) return 0.5;
      // Medium characters
      if ('ABCDEFHKNOPRSTUVXYZabcdefhknoprstuvxyz'.includes(char)) return 0.9;
      // Default
      return 0.8;
    };
    
    const estimatedWidth = word.split('').reduce((sum, char) => sum + getCharWidth(char), 0);
    
    // Calculate base size and responsive scaling separately
    const baseSize = Math.max(0.7, Math.min(1.2, 8 / estimatedWidth)); // rem units
    const vwSize = Math.max(1.2, Math.min(3, 12 / estimatedWidth)); // vw units
    
    return {
      fontSize: `clamp(${baseSize * 0.8}rem, ${vwSize}vw, ${baseSize}rem)`
    };
  };
  
  return (
    <button
      onClick={onClick}
      onMouseDown={(e) => {
        // Prevent focus on click to avoid Firefox focus border flash
        // Use setTimeout to blur after click processing to maintain responsiveness
        setTimeout(() => {
          e.currentTarget.blur();
        }, 0);
      }}
      style={{
        ...backgroundStyle,
        ...getTextSizeStyle(word)
      }}
      className={cn(
        "relative border border-tile-border rounded-lg",
        "p-2 min-h-[80px] flex flex-col items-center justify-center",
        "transition-all duration-200 ease-out",
        "font-medium",
        "shadow-sm focus:outline-none focus-visible:outline-none focus-within:outline-none",
        "transform",
        // Mobile Safari safe touch interactions
        "touch-manipulation",
        "select-none",
        "connections-tile", // Custom class for mobile-safe hover
        "@container", // Enable container queries
        !hasColors && "bg-tile-background text-tile-text",
        hasColors && "text-foreground animate-scale-in"
      )}
    >
      <span className="text-center leading-tight uppercase tracking-wide drop-shadow-sm px-1">
        {word}
      </span>
    </button>
  );
}