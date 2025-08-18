import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
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

interface GameState {
  originalWords: string[]; // Store the original order
  tileMarks: Record<number, Color[]>;
  activeColor: Color;
  selectedPill: 'today' | 'date' | 'custom';
  selectedDate: string;
  puzzleDate?: string; // Track which date this puzzle is for
  lastUpdated: string;
}

interface PuzzleState {
  tileMarks: Record<number, Color[]>;
  activeColor: Color;
  lastUpdated: string;
}

interface PuzzleStateCache {
  [puzzleDate: string]: PuzzleState;
}

interface CachedPuzzle {
  date: string;
  words: string[];
  fetchedAt: string;
}

interface PuzzleCache {
  [date: string]: CachedPuzzle;
}

// Sample words for the connections game
const SAMPLE_WORDS = [
  'BASS', 'FLOUNDER', 'SOLE', 'SALMON',
  'CONDUCTOR', 'ENGINEER', 'FIREMAN', 'BRAKEMAN',
  'SPRING', 'SUMMER', 'FALL', 'WINTER',
  'MARS', 'VENUS', 'JUPITER', 'SATURN'
];

const COLORS: Color[] = ['yellow', 'green', 'blue', 'purple', 'red'];

const STORAGE_KEY = 'connections-buddy-game-state';
const PUZZLE_CACHE_KEY = 'connections-buddy-puzzle-cache';
const PUZZLE_STATE_CACHE_KEY = 'connections-buddy-puzzle-states';

// Helper functions for proper timezone handling
const getLocalDateString = (date: Date = new Date()): string => {
  // Get YYYY-MM-DD format in local timezone
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTodayInUserTimezone = (): string => {
  return getLocalDateString(new Date());
};

const getMaxAllowedDate = (): string => {
  // NYT Connections releases at midnight Eastern Time
  // We'll be conservative and only allow today in user's timezone
  // This prevents the issue of showing too many future dates
  
  const now = new Date();
  const today = getLocalDateString(now);
  
  // For now, let's be conservative and only allow up to today
  // This ensures we don't show puzzles that aren't available yet
  return today;
};

const saveGameState = (state: GameState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to save game state:', error);
  }
};

const loadGameState = (): GameState | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.warn('Failed to load game state:', error);
  }
  return null;
};

const loadPuzzleCache = (): PuzzleCache => {
  try {
    const saved = localStorage.getItem(PUZZLE_CACHE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.warn('Failed to load puzzle cache:', error);
  }
  return {};
};

const savePuzzleCache = (cache: PuzzleCache) => {
  try {
    localStorage.setItem(PUZZLE_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn('Failed to save puzzle cache:', error);
  }
};

const getCachedPuzzle = (date: string): string[] | null => {
  const cache = loadPuzzleCache();
  const puzzle = cache[date];
  
  if (puzzle) {
    return puzzle.words;
  }
  
  return null;
};

const cachePuzzle = (date: string, words: string[]) => {
  const cache = loadPuzzleCache();
  cache[date] = {
    date,
    words,
    fetchedAt: new Date().toISOString()
  };
  savePuzzleCache(cache);
};

const loadPuzzleStateCache = (): PuzzleStateCache => {
  try {
    const saved = localStorage.getItem(PUZZLE_STATE_CACHE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.warn('Failed to load puzzle state cache:', error);
  }
  return {};
};

const savePuzzleStateCache = (cache: PuzzleStateCache) => {
  try {
    localStorage.setItem(PUZZLE_STATE_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn('Failed to save puzzle state cache:', error);
  }
};

const savePuzzleState = (puzzleDate: string, tileMarks: Record<number, Color[]>, activeColor: Color) => {
  const cache = loadPuzzleStateCache();
  cache[puzzleDate] = {
    tileMarks,
    activeColor,
    lastUpdated: new Date().toISOString()
  };
  savePuzzleStateCache(cache);
};

const loadPuzzleState = (puzzleDate: string): PuzzleState | null => {
  const cache = loadPuzzleStateCache();
  return cache[puzzleDate] || null;
};

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
  const puzzleDate = date || getTodayInUserTimezone(); // YYYY-MM-DD format in user timezone
  
  // Check cache first
  const cachedWords = getCachedPuzzle(puzzleDate);
  if (cachedWords) {
    return cachedWords;
  }
  
  // Fetch from API if not in cache
  const url = `https://proxy.corsfix.com/?https://www.nytimes.com/svc/connections/v2/${puzzleDate}.json`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch puzzle: ${response.statusText}`);
  }
  
  const data: NYTConnectionsData = await response.json();
  const words = parseNYTData(data);
  
  // Cache the result
  cachePuzzle(puzzleDate, words);
  
  return words;
};

export function ConnectionsGame() {
  // Initialize state with cached data or defaults
  const cachedState = loadGameState();
  
  // Determine correct pill state based on current date vs cached puzzle date
  const getCurrentPillState = (): 'today' | 'date' | 'custom' => {
    if (!cachedState) return 'custom';
    
    const today = getTodayInUserTimezone();
    const cachedPuzzleDate = cachedState.puzzleDate;
    const cachedPill = cachedState.selectedPill;
    
    // If they had 'today' selected but it's no longer that day, switch to 'date'
    if (cachedPill === 'today' && cachedPuzzleDate !== today) {
      return 'date';
    }
    
    return cachedPill;
  };

  const [activeColor, setActiveColor] = useState<Color>(cachedState?.activeColor || 'yellow');
  const [tileMarks, setTileMarks] = useState<Record<number, Color[]>>(cachedState?.tileMarks || {});
  const [originalWords, setOriginalWords] = useState(cachedState?.originalWords || SAMPLE_WORDS);
  const [words, setWords] = useState(cachedState?.originalWords || SAMPLE_WORDS); // Current display order (may be shuffled)
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState((cachedState?.originalWords || SAMPLE_WORDS).join(' '));
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(cachedState?.selectedDate || cachedState?.puzzleDate || '');
  const [selectedPill, setSelectedPill] = useState<'today' | 'date' | 'custom'>(getCurrentPillState());
  const [puzzleDate, setPuzzleDate] = useState(cachedState?.puzzleDate || '');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isResetDropTarget, setIsResetDropTarget] = useState(false);

  // Function to get current game state
  const getCurrentGameState = useCallback((): GameState => ({
    originalWords, // Save original order, not current shuffled order
    tileMarks,
    activeColor,
    selectedPill,
    selectedDate,
    puzzleDate,
    lastUpdated: new Date().toISOString()
  }), [originalWords, tileMarks, activeColor, selectedPill, selectedDate, puzzleDate]);

  // Save state changes to localStorage
  useEffect(() => {
    const gameState = getCurrentGameState();
    saveGameState(gameState);
    
    // Also save puzzle-specific state if we have a puzzle date
    if (puzzleDate) {
      savePuzzleState(puzzleDate, tileMarks, activeColor);
    }
  }, [getCurrentGameState, puzzleDate, tileMarks, activeColor]);

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
    
    setOriginalWords(newWords);
    setWords(newWords);
    setTileMarks({}); // Clear all markings when words change
    setPuzzleDate(''); // Clear puzzle date since this is custom
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditText(originalWords.join(' '));
    setIsEditing(false);
  };

  const handleLoadTodaysPuzzle = async () => {
    setIsLoading(true);
    setSelectedPill('today');
    const today = getTodayInUserTimezone();
    setSelectedDate(today); // Keep date state in sync
    try {
      const todaysWords = await fetchPuzzleByDate();
      setOriginalWords(todaysWords);
      setWords(todaysWords);
      
      // Load existing state for this puzzle date, or start fresh
      const savedPuzzleState = loadPuzzleState(today);
      if (savedPuzzleState) {
        setTileMarks(savedPuzzleState.tileMarks);
        setActiveColor(savedPuzzleState.activeColor);
      } else {
        setTileMarks({});
        setActiveColor('yellow');
      }
      
      setEditText(todaysWords.join(' '));
      setPuzzleDate(today);
    } catch (error) {
      console.error('Failed to load today\'s puzzle:', error);
      setSelectedPill('custom'); // Reset to custom on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleDatePick = async (date?: string) => {
    const dateToUse = date || selectedDate;
    if (!dateToUse) return;
    
    setIsLoading(true);
    const today = getTodayInUserTimezone();
    
    // If picking today's date, highlight "Today" button instead
    if (dateToUse === today) {
      setSelectedPill('today');
    } else {
      setSelectedPill('date');
    }
    
    try {
      const dateWords = await fetchPuzzleByDate(dateToUse);
      setOriginalWords(dateWords);
      setWords(dateWords);
      
      // Load existing state for this puzzle date, or start fresh
      const savedPuzzleState = loadPuzzleState(dateToUse);
      if (savedPuzzleState) {
        setTileMarks(savedPuzzleState.tileMarks);
        setActiveColor(savedPuzzleState.activeColor);
      } else {
        setTileMarks({});
        setActiveColor('yellow');
      }
      
      setEditText(dateWords.join(' '));
      setPuzzleDate(dateToUse);
    } catch (error) {
      console.error('Failed to load puzzle for date:', error);
      setSelectedPill('custom'); // Reset to custom on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleCalendarDateSelect = async (date: Date | undefined) => {
    if (!date) return;
    
    const dateString = date.toISOString().split('T')[0];
    setSelectedDate(dateString);
    setIsDatePickerOpen(false); // Close the popover
    await handleDatePick(dateString);
  };

  const handleShuffle = () => {
    const shuffledWords = [...originalWords]; // Shuffle from original order
    // Fisher-Yates shuffle algorithm
    for (let i = shuffledWords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledWords[i], shuffledWords[j]] = [shuffledWords[j], shuffledWords[i]];
    }
    setWords(shuffledWords); // Only update display order, not original
    // Keep tile marks but remap them to new positions
    const newTileMarks: Record<number, Color[]> = {};
    Object.entries(tileMarks).forEach(([oldIndex, colors]) => {
      const oldWord = words[parseInt(oldIndex)];
      const newIndex = shuffledWords.indexOf(oldWord);
      if (newIndex !== -1) {
        newTileMarks[newIndex] = colors;
      }
    });
    setTileMarks(newTileMarks);
  };

  const handleReset = () => {
    setTileMarks({});
    setActiveColor('yellow');
    setWords(originalWords); // Reset to original order
  };

  const handleColorSwap = (fromColor: Color, toColor: Color) => {
    if (fromColor === toColor) return;
    
    setTileMarks(prev => {
      const newTileMarks: Record<number, Color[]> = {};
      
      Object.entries(prev).forEach(([tileIndex, colors]) => {
        const newColors = colors.map(color => {
          if (color === fromColor) return toColor;
          if (color === toColor) return fromColor;
          return color;
        });
        newTileMarks[parseInt(tileIndex)] = newColors;
      });
      
      return newTileMarks;
    });
    
    // Also swap active color if it matches one of the swapped colors
    if (activeColor === fromColor) {
      setActiveColor(toColor);
    } else if (activeColor === toColor) {
      setActiveColor(fromColor);
    }
  };

  const handleColorClear = (colorToClear: Color) => {
    setTileMarks(prev => {
      const newTileMarks: Record<number, Color[]> = {};
      
      Object.entries(prev).forEach(([tileIndex, colors]) => {
        const newColors = colors.filter(color => color !== colorToClear);
        if (newColors.length > 0) {
          newTileMarks[parseInt(tileIndex)] = newColors;
        }
        // If no colors left, don't add the tile to newTileMarks (effectively removes it)
      });
      
      return newTileMarks;
    });
  };

  // Format date for display (e.g. "Aug 15")
  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return "Pick Date 📅";
    
    try {
      const date = new Date(dateString + 'T00:00:00'); // Ensure local timezone
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const day = date.getDate();
      return `${month} ${day}`;
    } catch {
      return "Pick Date 📅";
    }
  };

  return (
    <div className="flex-1 bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-5 pt-2 pb-4">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold text-foreground">
            Connections Buddy 🥰
          </h1>
          <p className="text-muted-foreground">
            Pick a color, then tap tiles to mark.
          </p>
        </div>

        {/* Pill Buttons */}
        <div className="flex justify-center">
          <div className="flex gap-2">
            <Button 
              key={`today-${selectedPill}`}
              variant="ghost"
              size="sm" 
              onClick={handleLoadTodaysPuzzle}
              disabled={isEditing || isLoading}
              className={`rounded-full px-3 py-1 text-xs transition-all border touch-manipulation select-none connections-pill ${
                selectedPill === 'today' 
                  ? 'text-white' 
                  : 'bg-[#f0eded] text-[#555] border-[#e0dede]'
              }`}
              style={selectedPill === 'today' ? {
                backgroundColor: 'rgb(104, 131, 191)',
                borderColor: 'rgb(104, 131, 191)'
              } : {}}
            >
              {isLoading && selectedPill === 'today' ? "Loading..." : "Today"}
            </Button>
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button 
                  key={`date-${selectedPill}-${puzzleDate}`}
                  variant="ghost"
                  size="sm" 
                  disabled={isEditing || isLoading}
                  className={`rounded-full px-3 py-1 text-xs transition-all border touch-manipulation select-none connections-pill ${
                    selectedPill === 'date' 
                      ? 'text-white' 
                      : 'bg-[#f0eded] text-[#555] border-[#e0dede]'
                  }`}
                  style={selectedPill === 'date' ? {
                    backgroundColor: 'rgb(104, 131, 191)',
                    borderColor: 'rgb(104, 131, 191)'
                  } : {}}
                >
                  {selectedPill === 'date' && puzzleDate ? formatDateForDisplay(puzzleDate) : "Pick Date 📅"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  selected={selectedDate ? new Date(selectedDate + 'T00:00:00') : undefined}
                  onSelect={handleCalendarDateSelect}
                  disabled={(date) => {
                    const dateString = getLocalDateString(date);
                    const maxAllowed = getMaxAllowedDate();
                    const minAllowed = '2023-06-12';
                    return dateString > maxAllowed || dateString < minAllowed;
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button 
              key={`custom-${selectedPill}`}
              variant="ghost"
              size="sm" 
              onClick={handleCustomPill}
              disabled={isLoading}
              className={`rounded-full px-3 py-1 text-xs transition-all border touch-manipulation select-none connections-pill ${
                selectedPill === 'custom' 
                  ? 'text-white' 
                  : 'bg-[#f0eded] text-[#555] border-[#e0dede]'
              }`}
              style={selectedPill === 'custom' ? {
                backgroundColor: 'rgb(104, 131, 191)',
                borderColor: 'rgb(104, 131, 191)'
              } : {}}
            >
              Custom...
            </Button>
          </div>
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

        {/* Color Swatches */}
        <div className="flex justify-between gap-3 md:gap-4">
          {COLORS.map(color => (
            <ColorSwatch
              key={color}
              color={color}
              isActive={activeColor === color}
              onClick={() => setActiveColor(color)}
              onColorSwap={handleColorSwap}
            />
          ))}
        </div>


        {/* Game Actions */}
        <div className="flex justify-between">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={handleReset}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              setIsResetDropTarget(true);
            }}
            onDragLeave={() => {
              setIsResetDropTarget(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              const draggedColor = e.dataTransfer.getData('text/plain') as Color;
              if (draggedColor) {
                handleColorClear(draggedColor);
              }
              setIsResetDropTarget(false);
            }}
            className={`gap-1 transition-all duration-200 ${
              isResetDropTarget 
                ? 'ring-2 ring-red-400 ring-opacity-50 scale-105 bg-red-50 border-red-300' 
                : ''
            }`}
          >
            Reset 🧹
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={handleShuffle}
            className="gap-1"
          >
            Shuffle 🎲
          </Button>
        </div>

      </div>
    </div>
  );
}