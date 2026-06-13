
import { db } from '@/lib/db';

export const getUserData = async () => {
  const { data: { session } } = await db.auth.getSession();
  if (!session) return null;
  
  const { data: profile } = await db.profiles.get(session.user.id);
  
  if (!profile) return session.user;
  
  // Fetch journal entries
  const { data: journalEntries } = await db.journal.list(session.user.id);
  
  // Fetch assessments
  const { data: assessments } = await db.assessments.list(session.user.id);
  
  console.log("Retrieved assessments:", assessments);
  
  // Format assessments to match the expected format in the app
  const formattedAssessments = assessments?.map(assessment => {
    let parsedResult;
    try {
      parsedResult = typeof assessment.result === 'string' 
        ? JSON.parse(assessment.result) 
        : assessment.result;
      
      console.log("Parsed assessment result:", parsedResult);
    } catch (e) {
      console.error('Error parsing assessment result', e);
      parsedResult = { depression: { score: 0, level: 'Unknown' }, anxiety: { score: 0, level: 'Unknown' }, generalWellbeing: 0 };
    }
    
    return {
      id: assessment.id,
      depression: parsedResult.depression || { score: 0, level: 'Unknown' },
      anxiety: parsedResult.anxiety || { score: 0, level: 'Unknown' },
      generalWellbeing: parsedResult.generalWellbeing || 0,
      completed: true,
      date: assessment.created_at,
      answers: assessment.answers
    };
  }) || [];
  
  console.log("Formatted assessments:", formattedAssessments);
  
  // Format and return user data
  return {
    ...session.user,
    ...profile,
    journalEntries: journalEntries || [],
    assessments: formattedAssessments
  };
};
