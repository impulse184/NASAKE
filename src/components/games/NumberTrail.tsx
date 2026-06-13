import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { saveGameSession } from '@/utils/gameService';
import { Clock, Gauge, SkipForward, ThumbsUp } from 'lucide-react';

// Web Audio API Synthesizer (completely client-side, lightweight)
const playTone = (freq: number, type: OscillatorType, duration: number) => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    gain.gain.setValueAtTime(0.05, ctx.currentTime); // Keep volume soft
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn("Web Audio API not supported:", e);
  }
};

const playCorrectClick = () => {
  playTone(523.25, 'sine', 0.08); // C5
};

const playLevelUp = () => {
  playTone(523.25, 'sine', 0.08); // C5
  setTimeout(() => playTone(659.25, 'sine', 0.08), 50); // E5
  setTimeout(() => playTone(783.99, 'sine', 0.15), 100); // G5
};

const playGameOverSound = () => {
  playTone(150.00, 'triangle', 0.4); // low buzz
};

interface GameState {
  sequence: number[];
  grid: number[];
  selected: number[];
  score: number;
  level: number;
  timeRemaining: number;
  gameOver: boolean;
  gameStarted: boolean;
}

export const NumberTrail: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    sequence: [],
    grid: [],
    selected: [],
    score: 0,
    level: 1,
    timeRemaining: 60,
    gameOver: false,
    gameStarted: false,
  });
  const [isMemorizing, setIsMemorizing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const memorizeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Function to generate a random sequence of numbers
  const generateSequence = (level: number): number[] => {
    const length = level + 2;
    return Array.from({ length }, () => Math.floor(Math.random() * 9) + 1);
  };

  // Function to generate a grid of numbers
  const generateGrid = (sequence: number[]): number[] => {
    const gridSize = 9;
    const sequenceSet = new Set(sequence);
    let grid = [...sequence];

    while (grid.length < gridSize) {
      let newNumber = Math.floor(Math.random() * 9) + 1;
      if (!sequenceSet.has(newNumber)) {
        grid.push(newNumber);
      }
    }

    // Shuffle the grid
    for (let i = grid.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [grid[i], grid[j]] = [grid[j], grid[i]];
    }

    return grid;
  };

  // Start the memorization phase
  const startMemorizePhase = (level: number) => {
    setIsMemorizing(true);
    if (timerRef.current) clearInterval(timerRef.current);
    if (memorizeTimerRef.current) clearTimeout(memorizeTimerRef.current);

    const duration = 2000 + level * 500; // 2.5s for lvl 1, 3s for lvl 2, etc.

    memorizeTimerRef.current = setTimeout(() => {
      setIsMemorizing(false);
      
      // Start the game recall timer
      timerRef.current = setInterval(() => {
        setGameState(prevState => {
          if (prevState.timeRemaining <= 1) {
            clearInterval(timerRef.current!);
            playGameOverSound();
            return { ...prevState, timeRemaining: 0, gameOver: true, gameStarted: false };
          }
          return { ...prevState, timeRemaining: prevState.timeRemaining - 1 };
        });
      }, 1000);
    }, duration);
  };

  // Start the game
  const startGame = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (memorizeTimerRef.current) clearTimeout(memorizeTimerRef.current);

    const initialSequence = generateSequence(1);
    setGameState({
      sequence: initialSequence,
      grid: generateGrid(initialSequence),
      selected: [],
      score: 0,
      level: 1,
      timeRemaining: 60,
      gameOver: false,
      gameStarted: true,
    });

    startMemorizePhase(1);
  };

  // Handle number selection
  const handleNumberClick = (number: number) => {
    if (gameState.gameOver || !gameState.gameStarted || isMemorizing) return;

    const nextInSequence = gameState.sequence[gameState.selected.length];

    if (number === nextInSequence) {
      const newSelected = [...gameState.selected, number];
      setGameState(prevState => ({ ...prevState, selected: newSelected }));

      if (newSelected.length === gameState.sequence.length) {
        // Level completed
        playLevelUp();
        if (timerRef.current) clearInterval(timerRef.current);
        
        const newLevel = gameState.level + 1;
        const newSequence = generateSequence(newLevel);
        
        setGameState(prevState => ({
          ...prevState,
          sequence: newSequence,
          grid: generateGrid(newSequence),
          selected: [],
          score: prevState.score + newLevel * 10,
          level: newLevel,
          timeRemaining: prevState.timeRemaining + 10,
        }));

        startMemorizePhase(newLevel);
      } else {
        playCorrectClick();
      }
    } else {
      // Game over
      playGameOverSound();
      if (timerRef.current) clearInterval(timerRef.current);
      setGameState(prevState => ({ ...prevState, gameOver: true, gameStarted: false }));
    }
  };

  // Save game results when the game is over
  useEffect(() => {
    if (gameState.gameOver) {
      const saveResults = async () => {
        const accuracy = gameState.sequence.length > 0 
          ? gameState.selected.length / gameState.sequence.length 
          : 0;

        const result = await saveGameSession({
          game_type: 'number_trail',
          score: gameState.score,
          accuracy: accuracy,
          sequence_length: gameState.sequence.length,
          metadata: {
            level: gameState.level,
            timeRemaining: gameState.timeRemaining
          }
        });

        if (result.error) {
          toast.error("Failed to save your results");
          console.error("Error saving game session:", result.error);
        } else {
          toast.success("Your results have been saved!");
        }
      };

      saveResults();
    }
  }, [gameState.gameOver]);

  // Handle keyboard inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input field
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        return;
      }

      if (!gameState.gameStarted || gameState.gameOver || isMemorizing) {
        return;
      }

      const key = e.key;
      const keyNum = parseInt(key);

      if (keyNum >= 1 && keyNum <= 9) {
        e.preventDefault();
        handleNumberClick(keyNum);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState.gameStarted, gameState.gameOver, isMemorizing, gameState.sequence, gameState.selected]);

  // Clean up timers
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (memorizeTimerRef.current) clearTimeout(memorizeTimerRef.current);
    };
  }, []);

  return (
    <Card className="w-full max-w-lg mx-auto border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0 pb-2">
        <CardTitle className="flex justify-between items-center text-xl">
          <span>Number Trail</span>
          {gameState.gameStarted && !gameState.gameOver && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
              <Clock className="h-4 w-4" />
              <span>{gameState.timeRemaining}s</span>
            </div>
          )}
        </CardTitle>
        <CardDescription>
          Challenge your working memory. Memorize the sequence of numbers, then select them in the correct order!
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {!gameState.gameStarted || gameState.gameOver ? (
          <div className="text-center space-y-6 py-4">
            {gameState.gameOver && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold">Game Over!</h3>
                <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                  <div className="p-4 bg-card border rounded-lg">
                    <div className="font-semibold text-muted-foreground text-sm">Score</div>
                    <div className="text-2xl font-bold">{gameState.score}</div>
                  </div>
                  <div className="p-4 bg-card border rounded-lg">
                    <div className="font-semibold text-muted-foreground text-sm">Level</div>
                    <div className="text-2xl font-bold">{gameState.level}</div>
                  </div>
                  <div className="p-4 bg-card border rounded-lg">
                    <div className="font-semibold text-muted-foreground text-sm">Sequence</div>
                    <div className="text-2xl font-bold">{gameState.sequence.length}</div>
                  </div>
                  <div className="p-4 bg-card border rounded-lg">
                    <div className="font-semibold text-muted-foreground text-sm">Time Left</div>
                    <div className="text-2xl font-bold">{gameState.timeRemaining}s</div>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Test your working memory and attention span.
                Select the numbers in the correct sequence to increase your score and level!
              </p>
              <Button
                className="bg-nasake-primary hover:bg-nasake-secondary w-full"
                onClick={startGame}
              >
                {gameState.gameOver ? "Play Again" : "Start Game"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-2">
            <div className="text-center bg-card border rounded-xl p-6 relative overflow-hidden">
              {isMemorizing ? (
                <>
                  <div className="text-4xl font-bold tracking-widest text-nasake-primary animate-pulse py-4 min-h-[80px] flex items-center justify-center">
                    {gameState.sequence.map((num, idx) => (
                      <span key={idx} className="mx-2">{num}</span>
                    ))}
                  </div>
                  <div className="text-sm font-semibold text-amber-500 uppercase tracking-wider">
                    ⚡ Memorize the sequence!
                  </div>
                </>
              ) : (
                <>
                  <div className="text-4xl font-bold tracking-widest py-4 min-h-[80px] flex items-center justify-center">
                    {gameState.sequence.slice(0, gameState.selected.length).map((num, idx) => (
                      <span key={idx} className="mx-2 text-muted-foreground line-through opacity-50">{num}</span>
                    ))}
                    {gameState.sequence.slice(gameState.selected.length).map((num, idx) => (
                      <span key={idx} className="mx-2 text-foreground font-mono">?</span>
                    ))}
                  </div>
                  <div className="text-sm font-semibold text-emerald-500 uppercase tracking-wider">
                    🎯 Tap the numbers in order!
                  </div>
                </>
              )}
              <div className="text-xs text-muted-foreground mt-4">
                Level {gameState.level}
              </div>
            </div>

            <div className="number-grid">
              {gameState.grid.map((number, index) => (
                <Button
                  key={index}
                  disabled={isMemorizing}
                  variant="outline"
                  className={`h-16 w-full text-2xl font-bold shadow-sm transition-all border ${
                    isMemorizing 
                      ? 'opacity-40 cursor-not-allowed' 
                      : 'hover:border-nasake-primary hover:bg-nasake-soft/10 active:scale-95 transform'
                  }`}
                  onClick={() => handleNumberClick(number)}
                >
                  {number}
                </Button>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Gauge className="h-4 w-4" />
                <span>Level {gameState.level}</span>
              </div>
              <div className="text-xl font-bold">{gameState.score} pts</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (timerRef.current) clearInterval(timerRef.current);
                  if (memorizeTimerRef.current) clearTimeout(memorizeTimerRef.current);
                  setGameState(prevState => ({ ...prevState, gameOver: true, gameStarted: false }));
                }}
                className="flex items-center gap-1 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <SkipForward className="h-3.5 w-3.5" />
                End Game
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      
      <style>
        {`
          .number-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0.75rem;
            max-width: 360px;
            margin: 0 auto;
          }
        `}
      </style>
    </Card>
  );
};
