import { useState } from "react";
import { ColorSwatch } from "./ColorSwatch";
import { ConnectionsTile } from "./ConnectionsTile";

type Color = 'yellow' | 'green' | 'blue' | 'purple' | 'red';

// Sample words for the connections game
const SAMPLE_WORDS = [
  'BASS', 'FLOUNDER', 'SOLE', 'SALMON',
  'CONDUCTOR', 'ENGINEER', 'FIREMAN', 'BRAKEMAN',
  'SPRING', 'SUMMER', 'FALL', 'WINTER',
  'MARS', 'VENUS', 'JUPITER', 'SATURN'
];

const COLORS: Color[] = ['yellow', 'green', 'blue', 'purple', 'red'];

export function ConnectionsGame() {
  const [activeColor, setActiveColor] = useState<Color>('yellow');
  const [tileMarks, setTileMarks] = useState<Record<number, Color[]>>({});

  const handleTileClick = (tileIndex: number) => {
    setTileMarks(prev => {
      const currentMarks = prev[tileIndex] || [];
      const hasActiveColor = currentMarks.includes(activeColor);
      
      if (hasActiveColor) {
        // Remove the active color
        const newMarks = currentMarks.filter(color => color !== activeColor);
        if (newMarks.length === 0) {
          const { [tileIndex]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [tileIndex]: newMarks };
      } else {
        // Add the active color
        return { ...prev, [tileIndex]: [...currentMarks, activeColor] };
      }
    });
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Connections Helper
          </h1>
          <p className="text-muted-foreground">
            Tap colors to select, tap tiles to mark with active color
          </p>
        </div>

        {/* Color Swatches */}
        <div className="flex justify-center gap-3">
          {COLORS.map(color => (
            <ColorSwatch
              key={color}
              color={color}
              isActive={activeColor === color}
              onClick={() => setActiveColor(color)}
            />
          ))}
        </div>

        {/* Active Color Indicator */}
        <div className="text-center">
          <span className="text-sm text-muted-foreground">
            Active: <span className="font-medium capitalize">{activeColor}</span>
          </span>
        </div>

        {/* Game Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SAMPLE_WORDS.map((word, index) => (
            <ConnectionsTile
              key={index}
              word={word}
              markedColors={tileMarks[index] || []}
              onClick={() => handleTileClick(index)}
            />
          ))}
        </div>

        {/* Instructions */}
        <div className="bg-card rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Select a color above, then tap tiles to mark them. Tap marked tiles again to remove that color.
          </p>
        </div>
      </div>
    </div>
  );
}