import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  const [words, setWords] = useState(SAMPLE_WORDS);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(SAMPLE_WORDS.join(' '));

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

  const handleEditStart = () => {
    setEditText(words.join(' '));
    setIsEditing(true);
  };

  const handleEditSave = () => {
    // Parse words from space or newline separated text
    const newWords = editText
      .split(/[\s\n]+/)
      .map(word => word.trim().toUpperCase())
      .filter(word => word.length > 0)
      .slice(0, 16); // Limit to 16 words
    
    setWords(newWords);
    setTileMarks({}); // Clear all markings when words change
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditText(words.join(' '));
    setIsEditing(false);
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
        <div className="flex justify-between gap-2">
          {COLORS.map(color => (
            <ColorSwatch
              key={color}
              color={color}
              isActive={activeColor === color}
              onClick={() => setActiveColor(color)}
            />
          ))}
        </div>

        {/* Edit Button */}
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleEditStart}
            disabled={isEditing}
          >
            Edit Words
          </Button>
        </div>

        {/* Word Editor */}
        {isEditing && (
          <div className="bg-card rounded-lg p-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                Enter 16 words (space or newline separated):
              </label>
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder="Enter words separated by spaces or new lines..."
                className="min-h-[120px]"
                autoFocus
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleEditCancel}>
                Cancel
              </Button>
              <Button onClick={handleEditSave}>
                Save Words
              </Button>
            </div>
          </div>
        )}

        {/* Game Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {words.map((word, index) => (
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