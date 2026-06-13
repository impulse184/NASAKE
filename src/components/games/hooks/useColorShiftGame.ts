
import { useState, useRef, useEffect } from 'react';
import { toast } from "@/components/ui/sonner";
import { saveGameSession } from '@/utils/gameService';
import { GameState, COLORS, ColorConfig } from '../types/colorShift';

// Web Audio API Sound Synthesizer (completely client-side, lightweight)
const playTone = (freq: number, type: OscillatorType, duration: number) => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    gain.gain.setValueAtTime(0.06, ctx.currentTime); // Keep volume soft
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn("Web Audio API not allowed or supported yet:", e);
  }
};

const playCorrectSound = () => {
  playTone(587.33, 'sine', 0.1); // D5
  setTimeout(() => playTone(880.00, 'sine', 0.15), 60); // A5
};

const playIncorrectSound = () => {
  playTone(180.00, 'triangle', 0.25); // low pitch
};

const playTimeUpSound = () => {
  playTone(130.00, 'triangle', 0.35); // low pitch
};

export const useColorShiftGame = () => {
  const [gameState, setGameState] = useState<GameState>({
    currentIndex: 0,
    currentWord: COLORS[0],
    currentColor: COLORS[1],
    timeLeft: 60,
    score: 0,
    rounds: 0,
    totalRounds: 50,
    currentTimeLimit: 4500,
    gameStarted: false,
    gameOver: false,
    startTime: null,
    reactionTimes: [],
    correctAnswers: 0,
  });
  
  const [roundTimeLeft, setRoundTimeLeft] = useState<number>(4500);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const roundTimerRef = useRef<NodeJS.Timeout | null>(null);

  const calculateTimeLimit = (round: number) => {
    const minTime = 1500;
    const maxTime = 4500;
    const timeReduction = (maxTime - minTime) * (round / 50);
    return Math.max(minTime, maxTime - timeReduction);
  };

  const handleTimeUp = () => {
    if (roundTimerRef.current) {
      clearInterval(roundTimerRef.current);
    }
    
    playTimeUpSound();
    toast.error("Time's up! Too slow!");
    
    const nextRounds = gameState.rounds + 1;
    const isGameOver = nextRounds >= gameState.totalRounds;
    
    setGameState(prev => ({
      ...prev,
      rounds: nextRounds,
      gameOver: isGameOver
    }));
    
    if (!isGameOver) {
      generateNewRound(nextRounds);
    }
  };

  const generateNewRound = (roundNumber: number) => {
    if (roundTimerRef.current) {
      clearInterval(roundTimerRef.current);
    }
    
    const wordIndex = Math.floor(Math.random() * COLORS.length);
    let colorIndex;
    
    do {
      colorIndex = Math.floor(Math.random() * COLORS.length);
    } while (colorIndex === wordIndex);
    
    const newTimeLimit = calculateTimeLimit(roundNumber);
    
    setGameState(prev => ({
      ...prev,
      currentWord: COLORS[wordIndex],
      currentColor: COLORS[colorIndex],
      startTime: Date.now(),
      currentTimeLimit: newTimeLimit,
    }));
    
    setRoundTimeLeft(newTimeLimit);
    
    roundTimerRef.current = setInterval(() => {
      setRoundTimeLeft(prev => {
        if (prev <= 50) {
          clearInterval(roundTimerRef.current!);
          handleTimeUp();
          return 0;
        }
        return prev - 50;
      });
    }, 50);
  };

  const handleColorSelect = (selectedColor: ColorConfig) => {
    if (!gameState.gameStarted || gameState.gameOver) return;
    
    if (roundTimerRef.current) {
      clearInterval(roundTimerRef.current);
    }
    
    const endTime = Date.now();
    const reactionTime = gameState.startTime ? endTime - gameState.startTime : 0;
    const isCorrect = selectedColor.name === gameState.currentColor.name;
    const nextRounds = gameState.rounds + 1;
    const isGameOver = nextRounds >= gameState.totalRounds;
    
    if (isCorrect) {
      playCorrectSound();
      toast.success("Correct!");
    } else {
      playIncorrectSound();
      toast.error("Incorrect! The color was " + gameState.currentColor.name);
    }
    
    setGameState(prev => {
      const newScore = isCorrect ? prev.score + Math.max(10, 100 - Math.floor(reactionTime / 10)) : prev.score;
      const newCorrectAnswers = isCorrect ? prev.correctAnswers + 1 : prev.correctAnswers;
      const newReactionTimes = [...prev.reactionTimes, reactionTime];
      
      if (isGameOver && gameTimerRef.current) {
        clearInterval(gameTimerRef.current);
      }
      
      return {
        ...prev,
        score: newScore,
        correctAnswers: newCorrectAnswers,
        reactionTimes: newReactionTimes,
        rounds: nextRounds,
        gameOver: isGameOver,
      };
    });
    
    if (!isGameOver) {
      generateNewRound(nextRounds);
    }
  };

  const startGame = () => {
    setGameState(prev => ({
      ...prev,
      gameStarted: true,
      gameOver: false,
      score: 0,
      rounds: 0,
      timeLeft: 60,
      correctAnswers: 0,
      reactionTimes: [],
      currentTimeLimit: 4500,
    }));
    
    generateNewRound(0);
    
    gameTimerRef.current = setInterval(() => {
      setGameState(prev => {
        if (prev.timeLeft <= 1) {
          clearInterval(gameTimerRef.current!);
          return { ...prev, timeLeft: 0, gameOver: true };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);
  };

  useEffect(() => {
    if (gameState.gameOver && gameState.rounds > 0) {
      const saveResults = async () => {
        const avgReactionTime = gameState.reactionTimes.length > 0
          ? gameState.reactionTimes.reduce((sum, time) => sum + time, 0) / gameState.reactionTimes.length
          : 0;
        
        const accuracy = gameState.correctAnswers / gameState.rounds;
        
        const result = await saveGameSession({
          game_type: 'color_shift',
          score: gameState.score,
          accuracy,
          reaction_time_ms: Math.round(avgReactionTime),
          metadata: {
            rounds: gameState.rounds,
            timeElapsed: 60 - gameState.timeLeft,
            reactionTimes: gameState.reactionTimes
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
  }, [gameState.gameOver, gameState.rounds]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      if (roundTimerRef.current) clearInterval(roundTimerRef.current);
    };
  }, []);

  return {
    gameState,
    roundTimeLeft,
    handleColorSelect,
    startGame,
  };
};
