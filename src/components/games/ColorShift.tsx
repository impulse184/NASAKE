
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, ThumbsUp, SkipForward } from 'lucide-react';
import { useColorShiftGame } from './hooks/useColorShiftGame';
import { ColorButtons } from './components/ColorButtons';

export const ColorShift: React.FC = () => {
  const { gameState, roundTimeLeft, handleColorSelect, startGame } = useColorShiftGame();

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Color Shift</span>
          {gameState.gameStarted && !gameState.gameOver && (
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span>{gameState.timeLeft}s</span>
            </div>
          )}
        </CardTitle>
        <CardDescription>
          Tap the color of the text, not what the word says!
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!gameState.gameStarted || gameState.gameOver ? (
          <div className="text-center space-y-6 py-4">
            {gameState.gameOver && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold">Game Over!</h3>
                <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                  <div className="p-4 bg-accent rounded-lg">
                    <div className="font-semibold text-muted-foreground text-sm">Score</div>
                    <div className="text-2xl font-bold">{gameState.score}</div>
                  </div>
                  <div className="p-4 bg-accent rounded-lg">
                    <div className="font-semibold text-muted-foreground text-sm">Accuracy</div>
                    <div className="text-2xl font-bold">
                      {Math.round((gameState.correctAnswers / gameState.rounds) * 100)}%
                    </div>
                  </div>
                  <div className="p-4 bg-accent rounded-lg">
                    <div className="font-semibold text-muted-foreground text-sm">Avg. Time</div>
                    <div className="text-2xl font-bold">
                      {gameState.reactionTimes.length
                        ? Math.round(gameState.reactionTimes.reduce((a, b) => a + b, 0) / gameState.reactionTimes.length)
                        : 0}ms
                    </div>
                  </div>
                  <div className="p-4 bg-accent rounded-lg">
                    <div className="font-semibold text-muted-foreground text-sm">Correct</div>
                    <div className="text-2xl font-bold">{gameState.correctAnswers}/{gameState.rounds}</div>
                  </div>
                </div>
              </div>
            )}
            <Button 
              className="bg-nasake-primary hover:bg-nasake-secondary w-full" 
              onClick={startGame}
            >
              {gameState.gameOver ? "Play Again" : "Start Game"}
            </Button>
          </div>
        ) : (
          <div className="space-y-8 py-4">
            <div className="text-center">
              <div className="w-full bg-gray-200 rounded-full h-1 mb-4">
                <div
                  className="bg-blue-600 h-1 rounded-full transition-all duration-50"
                  style={{ width: `${(roundTimeLeft / gameState.currentTimeLimit) * 100}%` }}
                />
              </div>
              <div 
                className="text-4xl font-bold py-10"
                style={{ color: gameState.currentColor.value }}
              >
                {gameState.currentWord.name.toUpperCase()}
              </div>
              <div className="text-muted-foreground text-sm">
                Round {gameState.rounds + 1}/{gameState.totalRounds}
              </div>
            </div>
            
            <ColorButtons onColorSelect={handleColorSelect} />
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <ThumbsUp className="h-5 w-5" />
                <span>{gameState.correctAnswers}/{gameState.rounds}</span>
              </div>
              <div className="text-2xl font-bold">{gameState.score}</div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleColorSelect(gameState.currentColor)}
                className="flex items-center gap-1"
              >
                <SkipForward className="h-4 w-4" />
                Skip
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
