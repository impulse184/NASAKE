
import { pipeline } from '@huggingface/transformers';

interface MoodAnalysis {
  emotion: string;
  sentiment: string;
  score: number;
  emotions?: { [key: string]: number };
}

let emotionClassifier: any = null;

const initializeModel = async () => {
  if (!emotionClassifier) {
    console.log("Initializing GoEmotions model...");
    emotionClassifier = await pipeline(
      'text-classification', 
      'SamLowe/roberta-base-go_emotions'
    );
  }
  return emotionClassifier;
};

export const analyzeMood = async (text: string): Promise<MoodAnalysis> => {
  try {
    const classifier = await initializeModel();
    console.log("Analyzing text with GoEmotions model...");
    
    const results = await classifier(text, { topk: 3 });
    console.log("GoEmotions results:", results);
    
    // Get the primary emotion (highest score)
    const primaryEmotion = results[0];
    
    // Map GoEmotions to our sentiment categories
    const positiveEmotions = ['admiration', 'amusement', 'approval', 'caring', 'desire', 'excitement', 'gratitude', 'joy', 'love', 'optimism', 'pride', 'relief'];
    const negativeEmotions = ['anger', 'annoyance', 'disappointment', 'disapproval', 'disgust', 'embarrassment', 'fear', 'grief', 'nervousness', 'remorse', 'sadness'];
    const neutralEmotions = ['confusion', 'curiosity', 'realization', 'surprise'];
    
    let sentiment: string;
    if (positiveEmotions.includes(primaryEmotion.label)) {
      sentiment = 'positive';
    } else if (negativeEmotions.includes(primaryEmotion.label)) {
      sentiment = 'negative';
    } else {
      sentiment = 'neutral';
    }
    
    // Create emotion distribution object
    const emotions = results.reduce((acc: any, result: any) => {
      acc[result.label] = result.score;
      return acc;
    }, {});
    
    return {
      emotion: primaryEmotion.label,
      sentiment,
      score: primaryEmotion.score,
      emotions
    };
  } catch (error) {
    console.error("Error analyzing mood:", error);
    return fallbackMoodAnalysis(text);
  }
};

const fallbackMoodAnalysis = (text: string): Promise<MoodAnalysis> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const words = text.toLowerCase().split(/\s+/);
      
      const positiveWords = [
        'happy', 'good', 'great', 'excellent', 'wonderful', 
        'amazing', 'joy', 'pleasure', 'satisfied', 'grateful',
        'thankful', 'excited', 'love', 'enjoy', 'positive'
      ];
      
      const negativeWords = [
        'sad', 'bad', 'awful', 'terrible', 'horrible',
        'unhappy', 'depressed', 'angry', 'upset', 'disappointed',
        'frustrated', 'annoyed', 'hate', 'dislike', 'negative'
      ];
      
      const anxietyWords = [
        'anxious', 'worried', 'nervous', 'stress', 'fear',
        'panic', 'afraid', 'uneasy', 'tense', 'dread'
      ];
      
      let positiveCount = 0;
      let negativeCount = 0;
      let anxietyCount = 0;
      
      words.forEach(word => {
        if (positiveWords.includes(word)) positiveCount++;
        if (negativeWords.includes(word)) negativeCount++;
        if (anxietyWords.includes(word)) anxietyCount++;
      });
      
      let sentiment: string;
      let score: number;
      
      const totalWords = words.length;
      const sentimentScore = (positiveCount - negativeCount) / Math.max(1, totalWords) + 0.5;
      
      if (sentimentScore > 0.6) {
        sentiment = "positive";
        score = Math.min(sentimentScore, 0.9);
      } else if (sentimentScore < 0.4) {
        sentiment = "negative";
        score = Math.max(1 - sentimentScore, 0.1);
      } else {
        sentiment = "neutral";
        score = 0.5;
      }
      
      let emotion: string;
      if (anxietyCount > 0 && anxietyCount >= positiveCount && anxietyCount >= negativeCount) {
        emotion = "anxious";
      } else if (positiveCount > negativeCount) {
        emotion = "happy";
      } else if (negativeCount > positiveCount) {
        emotion = "sad";
      } else {
        emotion = "neutral";
      }
      
      resolve({
        emotion,
        sentiment,
        score: parseFloat(score.toFixed(2))
      });
    }, 1500);
  });
};
