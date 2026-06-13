import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Heart, Sparkles } from 'lucide-react';

type BreathingPhase = 'idle' | 'inhale' | 'holdIn' | 'exhale' | 'holdOut';

export const BreathingSpace: React.FC = () => {
  const [phase, setPhase] = useState<BreathingPhase>('idle');
  const [secondsLeft, setSecondsLeft] = useState(4);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (phase === 'idle') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // Move to next phase
          setPhase((currentPhase) => {
            switch (currentPhase) {
              case 'inhale':
                return 'holdIn';
              case 'holdIn':
                return 'exhale';
              case 'exhale':
                return 'holdOut';
              case 'holdOut':
                setCyclesCompleted((c) => c + 1);
                return 'inhale';
              default:
                return 'idle';
            }
          });
          return 4; // Each phase lasts 4 seconds in box breathing
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  const handleStart = () => {
    setPhase('inhale');
    setSecondsLeft(4);
    setCyclesCompleted(0);
  };

  const handleStop = () => {
    setPhase('idle');
    setSecondsLeft(4);
  };

  const handleReset = () => {
    setPhase('idle');
    setSecondsLeft(4);
    setCyclesCompleted(0);
  };

  const getPhaseText = () => {
    switch (phase) {
      case 'inhale':
        return 'Breathe In';
      case 'holdIn':
        return 'Hold Your Breath';
      case 'exhale':
        return 'Breathe Out';
      case 'holdOut':
        return 'Hold and Empty';
      default:
        return 'Ready to Begin?';
    }
  };

  const getPhaseInstruction = () => {
    switch (phase) {
      case 'inhale':
        return 'Inhale deeply through your nose, filling your chest.';
      case 'holdIn':
        return 'Rest comfortably in the fullness of your breath.';
      case 'exhale':
        return 'Exhale slowly, releasing all tension and stress.';
      case 'holdOut':
        return 'Rest gently in the stillness before your next breath.';
      default:
        return 'Take a comfortable posture and click start to begin your box breathing session.';
    }
  };

  const getBubbleScaleClass = () => {
    switch (phase) {
      case 'inhale':
      case 'holdIn':
        return 'scale-125';
      case 'exhale':
      case 'holdOut':
        return 'scale-75';
      default:
        return 'scale-100';
    }
  };

  const getBubbleDuration = () => {
    switch (phase) {
      case 'inhale':
      case 'exhale':
        return '4000ms';
      case 'holdIn':
      case 'holdOut':
        return '1000ms';
      default:
        return '500ms';
    }
  };

  const getBubbleColor = () => {
    switch (phase) {
      case 'inhale':
        return 'bg-gradient-to-r from-emerald-400 to-teal-400 shadow-[0_0_50px_rgba(52,211,153,0.5)]';
      case 'holdIn':
        return 'bg-gradient-to-r from-teal-400 to-sky-400 shadow-[0_0_50px_rgba(45,212,191,0.6)]';
      case 'exhale':
        return 'bg-gradient-to-r from-sky-400 to-indigo-400 shadow-[0_0_50px_rgba(56,189,248,0.5)]';
      case 'holdOut':
        return 'bg-gradient-to-r from-indigo-400 to-purple-400 shadow-[0_0_50px_rgba(129,140,248,0.4)]';
      default:
        return 'bg-gradient-to-r from-nasake-primary to-nasake-secondary shadow-md';
    }
  };

  return (
    <Card className="w-full border-none nasake-card overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-nasake-primary animate-pulse" />
          Breathing Space
        </CardTitle>
        <CardDescription>
          Release stress and calm your mind with box breathing
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-8 relative">
        {/* Animated breathing bubble */}
        <div className="relative flex items-center justify-center h-64 w-full">
          <div
            className={`absolute rounded-full h-32 w-32 ease-linear transform transition-transform ${getBubbleScaleClass()} ${getBubbleColor()} flex flex-col items-center justify-center text-white`}
            style={{ transitionDuration: getBubbleDuration() }}
          >
            {phase !== 'idle' && (
              <div className="flex flex-col items-center select-none">
                <span className="text-4xl font-bold font-display leading-none">{secondsLeft}</span>
                <span className="text-xs uppercase tracking-widest font-semibold mt-1 opacity-80">secs</span>
              </div>
            )}
            {phase === 'idle' && <Heart className="h-10 w-10 text-white" />}
          </div>
          
          {/* Decorative outer rings */}
          {phase !== 'idle' && (
            <div className={`absolute rounded-full h-48 w-48 border border-muted/20 animate-ping opacity-25`} />
          )}
        </div>

        {/* Phase instructions */}
        <div className="text-center max-w-sm mt-6 min-h-[100px] flex flex-col justify-center">
          <h4 className="text-xl font-semibold text-foreground capitalize transition-colors duration-300">
            {getPhaseText()}
          </h4>
          <p className="text-sm text-muted-foreground mt-2 px-4 transition-all duration-300">
            {getPhaseInstruction()}
          </p>
        </div>

        {/* Session Stats */}
        {phase !== 'idle' && (
          <div className="flex items-center gap-2 mt-4 px-3 py-1.5 rounded-full bg-accent text-xs font-medium text-nasake-primary animate-fade-in">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Cycles Completed: {cyclesCompleted}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-center gap-4 bg-muted/20 py-4 border-t">
        {phase === 'idle' ? (
          <Button 
            onClick={handleStart}
            className="rounded-full px-6 bg-nasake-primary hover:bg-nasake-secondary text-white font-medium flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            Start Session
          </Button>
        ) : (
          <>
            <Button 
              variant="outline"
              onClick={handleStop}
              className="rounded-full px-6 flex items-center gap-2"
            >
              <Pause className="h-4 w-4" />
              Pause
            </Button>
            <Button 
              variant="ghost"
              size="icon"
              onClick={handleReset}
              className="rounded-full text-muted-foreground hover:text-foreground hover:bg-accent"
              title="Reset"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
};
