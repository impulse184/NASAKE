import { db } from '@/lib/db';

export interface GameSession {
  id?: string;
  user_id?: string;
  game_type: 'color_shift' | 'number_trail';
  score: number;
  accuracy: number;
  reaction_time_ms?: number;
  sequence_length?: number;
  metadata?: any;
  created_at?: string;
}

export const saveGameSession = async (gameSession: GameSession): Promise<{ data: any; error: any }> => {
  const { data: { session } } = await db.auth.getSession();
  
  if (!session) {
    return { data: null, error: new Error('User not authenticated') };
  }

  const { data, error } = await db.games.insert({
    ...gameSession,
    user_id: session.user.id
  });

  return { data, error };
};

export const getUserGameSessions = async (gameType?: 'color_shift' | 'number_trail'): Promise<{ data: GameSession[]; error: any }> => {
  const { data: { session } } = await db.auth.getSession();
  
  if (!session) {
    return { data: [], error: new Error('User not authenticated') };
  }
  
  const { data, error } = await db.games.list(session.user.id, gameType);
  
  return { data: (data || []) as GameSession[], error };
};

export const getCognitiveInsights = async (): Promise<{ data: any; error: any }> => {
  const { data: { session } } = await db.auth.getSession();
  
  if (!session) {
    return { data: null, error: new Error('User not authenticated') };
  }
  
  // Query user's game sessions and calculate insights
  const [colorShiftResponse, numberTrailResponse, assessmentsResponse] = await Promise.all([
    db.games.list(session.user.id, 'color_shift'),
    db.games.list(session.user.id, 'number_trail'),
    db.assessments.list(session.user.id),
  ]);

  // Cast the query results to the appropriate types
  const colorShiftData = ((colorShiftResponse.data || []) as unknown) as GameSession[];
  const numberTrailData = ((numberTrailResponse.data || []) as unknown) as GameSession[];
  const latestAssessment = assessmentsResponse.data?.[0] || null;
  
  // Calculate averages and insights
  const avgColorShiftScore = colorShiftData.length 
    ? colorShiftData.reduce((sum, game) => sum + game.score, 0) / colorShiftData.length 
    : 0;
    
  const avgNumberTrailScore = numberTrailData.length 
    ? numberTrailData.reduce((sum, game) => sum + game.score, 0) / numberTrailData.length 
    : 0;
    
  const avgAccuracy = [...colorShiftData, ...numberTrailData].length 
    ? [...colorShiftData, ...numberTrailData].reduce((sum, game) => sum + game.accuracy, 0) / 
      [...colorShiftData, ...numberTrailData].length 
    : 0;
    
  const avgReactionTime = colorShiftData.filter(game => game.reaction_time_ms).length 
    ? colorShiftData
        .filter(game => game.reaction_time_ms)
        .reduce((sum, game) => sum + game.reaction_time_ms!, 0) / 
        colorShiftData.filter(game => game.reaction_time_ms).length 
    : 0;
    
  const maxSequenceLength = numberTrailData.length 
    ? Math.max(...numberTrailData.map(game => game.sequence_length || 0)) 
    : 0;
  
  // Combine with assessment data for insights
  const insights = {
    avgColorShiftScore,
    avgNumberTrailScore,
    avgAccuracy,
    avgReactionTime,
    maxSequenceLength,
    latestAssessment,
    cognitiveProfile: generateCognitiveProfile(avgColorShiftScore, maxSequenceLength, avgAccuracy),
    recentProgress: calculateRecentProgress([...colorShiftData, ...numberTrailData])
  };
  
  return { data: insights, error: null };
};

// Helper function to generate a cognitive profile based on game performance
const generateCognitiveProfile = (
  colorShiftScore: number, 
  maxSequenceLength: number, 
  accuracy: number
): string => {
  // Arbitrary thresholds for demo purposes
  const attentionLevel = colorShiftScore > 75 ? 'high' : colorShiftScore > 50 ? 'moderate' : 'needs improvement';
  const memoryLevel = maxSequenceLength > 7 ? 'excellent' : maxSequenceLength > 5 ? 'good' : 'average';
  const focusLevel = accuracy > 0.9 ? 'excellent' : accuracy > 0.7 ? 'good' : 'needs improvement';
  
  return `Attention: ${attentionLevel}, Working Memory: ${memoryLevel}, Focus: ${focusLevel}`;
};

// Calculate recent progress
const calculateRecentProgress = (sessions: GameSession[]) => {
  if (sessions.length < 2) return 'Not enough data to determine progress';
  
  // Sort by created_at descending (most recent first)
  const sortedSessions = [...sessions].sort((a, b) => {
    return new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime();
  });
  
  // Compare recent vs earlier sessions
  const recentSessions = sortedSessions.slice(0, Math.ceil(sortedSessions.length / 2));
  const earlierSessions = sortedSessions.slice(Math.ceil(sortedSessions.length / 2));
  
  if (recentSessions.length === 0 || earlierSessions.length === 0) {
    return 'Not enough data to determine progress';
  }
  
  const recentAvgScore = recentSessions.reduce((sum, session) => sum + session.score, 0) / recentSessions.length;
  const earlierAvgScore = earlierSessions.reduce((sum, session) => sum + session.score, 0) / earlierSessions.length;
  
  const improvement = ((recentAvgScore - earlierAvgScore) / earlierAvgScore) * 100;
  
  if (improvement > 10) return 'Significant improvement';
  if (improvement > 5) return 'Moderate improvement';
  if (improvement > -5) return 'Stable performance';
  return 'Performance declining';
};
