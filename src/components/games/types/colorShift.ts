
export interface GameState {
  currentIndex: number;
  currentWord: ColorConfig;
  currentColor: ColorConfig;
  timeLeft: number;
  score: number;
  rounds: number;
  totalRounds: number;
  currentTimeLimit: number;
  gameStarted: boolean;
  gameOver: boolean;
  startTime: number | null;
  reactionTimes: number[];
  correctAnswers: number;
}

export interface ColorConfig {
  name: string;
  value: string;
}

export const COLORS: ColorConfig[] = [
  { name: 'red', value: 'rgb(239, 68, 68)' },
  { name: 'blue', value: 'rgb(59, 130, 246)' },
  { name: 'green', value: 'rgb(34, 197, 94)' },
  { name: 'yellow', value: 'rgb(234, 179, 8)' },
  { name: 'purple', value: 'rgb(168, 85, 247)' },
  { name: 'orange', value: 'rgb(249, 115, 22)' },
  { name: 'pink', value: 'rgb(236, 72, 153)' },
  { name: 'cyan', value: 'rgb(6, 182, 212)' },
  { name: 'lime', value: 'rgb(132, 204, 22)' },
  { name: 'indigo', value: 'rgb(99, 102, 241)' }
];
