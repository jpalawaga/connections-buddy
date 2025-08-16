import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ColorSwatch } from "./ColorSwatch";
import { ConnectionsTile } from "./ConnectionsTile";

type Color = 'yellow' | 'green' | 'blue' | 'purple' | 'red';

interface NYTCard {
  content: string;
  position: number;
}

interface NYTCategory {
  title: string;
  cards: NYTCard[];
}

interface NYTConnectionsData {
  status: string;
  id: number;
  print_date: string;
  editor: string;
  categories: NYTCategory[];
}

// Sample words for the connections game
const SAMPLE_WORDS = [
  'BASS', 'FLOUNDER', 'SOLE', 'SALMON',
  'CONDUCTOR', 'ENGINEER', 'FIREMAN', 'BRAKEMAN',
  'SPRING', 'SUMMER', 'FALL', 'WINTER',
  'MARS', 'VENUS', 'JUPITER', 'SATURN'
];

const COLORS: Color[] = ['yellow', 'green', 'blue', 'purple', 'red'];

const parseNYTData = (data: NYTConnectionsData): string[] => {
  // Extract all cards and sort by position
  const allCards: NYTCard[] = [];
  data.categories.forEach(category => {
    allCards.push(...category.cards);
  });
  
  // Sort by position and extract content
  return allCards
    .sort((a, b) => a.position - b.position)
    .map(card => card.content.toUpperCase());
};

const fetchPuzzleByDate = async (date?: string): Promise<string[]> => {
  const puzzleDate = date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const url = `https://proxy.corsfix.com/?https://www.nytimes.com/svc/connections/v2/${puzzleDate}.json`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch puzzle: ${response.statusText}`);
  }
  
  const data: NYTConnectionsData = await response.json();
  return parseNYTData(data);
};

export function ConnectionsGame() {
  const [activeColor, setActiveColor] = useState<Color>('yellow');
  const [tileMarks, setTileMarks] = useState<Record<number, Color[]>>({});
  const [words, setWords] = useState(SAMPLE_WORDS);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(SAMPLE_WORDS.join(' '));
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedPill, setSelectedPill] = useState<'today' | 'date' | 'custom'>('custom');

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
    setSelectedPill('custom');
  };

  const handleCustomPill = () => {
    if (selectedPill === 'custom' && !isEditing) {
      // If already selected and not editing, open editor
      handleEditStart();
    } else {
      // Just select the pill
      setSelectedPill('custom');
      setIsEditing(false);
    }
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

  const handleLoadTodaysPuzzle = async () => {
    setIsLoading(true);
    setSelectedPill('today');
    try {
      const todaysWords = await fetchPuzzleByDate();
      setWords(todaysWords);
      setTileMarks({}); // Clear all markings when words change
      setEditText(todaysWords.join(' '));
    } catch (error) {
      console.error('Failed to load today\'s puzzle:', error);
      setSelectedPill(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDatePick = async () => {
    if (!selectedDate) return;
    
    setIsLoading(true);
    setSelectedPill('date');
    try {
      const dateWords = await fetchPuzzleByDate(selectedDate);
      setWords(dateWords);
      setTileMarks({}); // Clear all markings when words change
      setEditText(dateWords.join(' '));
      setShowDatePicker(false);
    } catch (error) {
      console.error('Failed to load puzzle for date:', error);
      setSelectedPill(null);
    } finally {
      setIsLoading(false);
    }
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
            Pick a color, then tap tiles to mark.
          </p>
        </div>

        {/* Pill Buttons */}
        <div className="flex justify-center">
          <div className="flex gap-2">
            <Button 
              variant="ghost"
              size="sm" 
              onClick={handleLoadTodaysPuzzle}
              disabled={isEditing || isLoading}
              className={`rounded-full px-3 py-1 text-xs transition-all border ${
                selectedPill === 'today' 
                  ? 'bg-blue-600 border-blue-600 text-blue-50 hover:bg-blue-700' 
                  : 'bg-[#f0eded] text-[#555] border-[#e0dede] hover:bg-[#ebe8e8]'
              }`}
            >
              {isLoading && selectedPill === 'today' ? "Loading..." : "Today"}
            </Button>
            <Button 
              variant="ghost"
              size="sm" 
              onClick={() => setShowDatePicker(true)}
              disabled={isEditing || isLoading}
              className={`rounded-full px-3 py-1 text-xs transition-all border ${
                selectedPill === 'date' 
                  ? 'bg-blue-600 border-blue-600 text-blue-50 hover:bg-blue-700' 
                  : 'bg-[#f0eded] text-[#555] border-[#e0dede] hover:bg-[#ebe8e8]'
              }`}
            >
              Pick Date 📅
            </Button>
            <Button 
              variant="ghost"
              size="sm" 
              onClick={handleCustomPill}
              disabled={isLoading}
              className={`rounded-full px-3 py-1 text-xs transition-all border ${
                selectedPill === 'custom' 
                  ? 'bg-blue-600 border-blue-600 text-blue-50 hover:bg-blue-700' 
                  : 'bg-[#f0eded] text-[#555] border-[#e0dede] hover:bg-[#ebe8e8]'
              }`}
            >
              Custom...
            </Button>
          </div>
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

        {/* Date Picker */}
        {showDatePicker && (
          <div className="bg-card rounded-lg p-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                Select a date to load that day's Connections puzzle:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-2 border border-border rounded-md bg-background text-foreground"
                min="2023-06-12"
                max={new Date().toISOString().split('T')[0]}
                autoFocus
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDatePicker(false)}>
                Cancel
              </Button>
              <Button onClick={handleDatePick} disabled={!selectedDate}>
                Load Puzzle
              </Button>
            </div>
          </div>
        )}

        {/* Game Grid */}
        <div className="grid grid-cols-4 gap-3">
          {words.map((word, index) => (
            <ConnectionsTile
              key={index}
              word={word}
              markedColors={tileMarks[index] || []}
              onClick={() => handleTileClick(index)}
            />
          ))}
        </div>

      </div>
    </div>
  );
}