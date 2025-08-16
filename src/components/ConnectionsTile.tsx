import { cn } from "@/lib/utils";

interface ConnectionsTileProps {
  word: string;
  markedColors: Array<'yellow' | 'green' | 'blue' | 'purple' | 'red'>;
  onClick: () => void;
}

const colorDotClasses = {
  yellow: 'bg-connections-yellow-dark',
  green: 'bg-connections-green-dark',
  blue: 'bg-connections-blue-dark',
  purple: 'bg-connections-purple-dark',
  red: 'bg-connections-red-dark',
};

export function ConnectionsTile({ word, markedColors, onClick }: ConnectionsTileProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative bg-tile-background border border-tile-border rounded-lg",
        "p-4 min-h-[80px] flex flex-col items-center justify-center",
        "hover:bg-tile-hover active:scale-95 transition-all duration-200",
        "text-tile-text font-medium text-sm md:text-base",
        "shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
      )}
    >
      <span className="text-center leading-tight uppercase tracking-wide">
        {word}
      </span>
      
      {/* Color dots */}
      {markedColors.length > 0 && (
        <div className="absolute top-1 right-1 flex gap-1">
          {markedColors.map((color, index) => (
            <div
              key={`${color}-${index}`}
              className={cn(
                "w-2 h-2 rounded-full",
                colorDotClasses[color]
              )}
            />
          ))}
        </div>
      )}
    </button>
  );
}