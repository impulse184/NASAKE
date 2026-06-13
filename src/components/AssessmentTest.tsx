import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle, CheckCircle2, ArrowRight, Loader2, Brain, Activity, Smile } from 'lucide-react';
import { db } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';

const assessmentQuestions = [
  {
    id: "q1",
    text: "How often have you been bothered by feeling down, depressed, or hopeless over the past 2 weeks?",
    options: [
      { value: "0", label: "Not at all" },
      { value: "1", label: "Several days" },
      { value: "2", label: "More than half the days" },
      { value: "3", label: "Nearly every day" },
    ],
    category: "depression"
  },
  {
    id: "q2",
    text: "How often have you had little interest or pleasure in doing things over the past 2 weeks?",
    options: [
      { value: "0", label: "Not at all" },
      { value: "1", label: "Several days" },
      { value: "2", label: "More than half the days" },
      { value: "3", label: "Nearly every day" },
    ],
    category: "depression"
  },
  {
    id: "q3",
    text: "How often have you been bothered by trouble falling or staying asleep, or sleeping too much?",
    options: [
      { value: "0", label: "Not at all" },
      { value: "1", label: "Several days" },
      { value: "2", label: "More than half the days" },
      { value: "3", label: "Nearly every day" },
    ],
    category: "depression"
  },
  {
    id: "q4",
    text: "How often have you been bothered by feeling nervous, anxious, or on edge?",
    options: [
      { value: "0", label: "Not at all" },
      { value: "1", label: "Several days" },
      { value: "2", label: "More than half the days" },
      { value: "3", label: "Nearly every day" },
    ],
    category: "anxiety"
  },
  {
    id: "q5",
    text: "How often have you been bothered by not being able to stop or control worrying?",
    options: [
      { value: "0", label: "Not at all" },
      { value: "1", label: "Several days" },
      { value: "2", label: "More than half the days" },
      { value: "3", label: "Nearly every day" },
    ],
    category: "anxiety"
  },
  {
    id: "q6",
    text: "How often have you been bothered by worrying too much about different things?",
    options: [
      { value: "0", label: "Not at all" },
      { value: "1", label: "Several days" },
      { value: "2", label: "More than half the days" },
      { value: "3", label: "Nearly every day" },
    ],
    category: "anxiety"
  },
  {
    id: "q7",
    text: "How often have you been bothered by trouble relaxing?",
    options: [
      { value: "0", label: "Not at all" },
      { value: "1", label: "Several days" },
      { value: "2", label: "More than half the days" },
      { value: "3", label: "Nearly every day" },
    ],
    category: "anxiety"
  },
  {
    id: "q8",
    text: "How often have you felt tired or had little energy?",
    options: [
      { value: "0", label: "Not at all" },
      { value: "1", label: "Several days" },
      { value: "2", label: "More than half the days" },
      { value: "3", label: "Nearly every day" },
    ],
    category: "depression"
  },
  {
    id: "q9",
    text: "How often have you had trouble concentrating on things?",
    options: [
      { value: "0", label: "Not at all" },
      { value: "1", label: "Several days" },
      { value: "2", label: "More than half the days" },
      { value: "3", label: "Nearly every day" },
    ],
    category: "general"
  },
  {
    id: "q10",
    text: "How often have you felt bad about yourself - or that you are a failure or have let yourself or your family down?",
    options: [
      { value: "0", label: "Not at all" },
      { value: "1", label: "Several days" },
      { value: "2", label: "More than half the days" },
      { value: "3", label: "Nearly every day" },
    ],
    category: "depression"
  }
];

interface AssessmentResults {
  depression: { score: number; level: string; }
  anxiety: { score: number; level: string; }
  generalWellbeing: number;
  completed: boolean;
  date: string;
}

export const AssessmentTest = () => {
  const [selectedType, setSelectedType] = useState<'full' | 'depression' | 'anxiety' | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState<string>("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [results, setResults] = useState<AssessmentResults | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const activeQuestions = selectedType === 'depression'
    ? assessmentQuestions.filter(q => q.category === 'depression')
    : selectedType === 'anxiety'
    ? assessmentQuestions.filter(q => q.category === 'anxiety')
    : assessmentQuestions;

  const totalQuestions = activeQuestions.length;
  const progress = totalQuestions > 0 ? (currentQuestionIndex / totalQuestions) * 100 : 0;
  
  const handleNext = () => {
    if (!currentAnswer) {
      toast({
        title: "Please select an answer",
        description: "Select an option before continuing",
        variant: "destructive",
      });
      return;
    }
    
    const updatedAnswers = {
      ...answers,
      [activeQuestions[currentQuestionIndex].id]: currentAnswer
    };
    setAnswers(updatedAnswers);
    
    setCurrentAnswer("");
    
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      submitAssessment(updatedAnswers);
    }
  };
  
  const submitAssessment = async (finalAnswers: Record<string, string>) => {
    setIsSubmitting(true);
    
    try {
      let depressionScore = 0;
      let anxietyScore = 0;
      let generalScore = 0;
      let depressionQuestions = 0;
      let anxietyQuestions = 0;
      let generalQuestions = 0;
      
      activeQuestions.forEach(question => {
        const answer = parseInt(finalAnswers[question.id] || "0");
        
        switch (question.category) {
          case "depression":
            depressionScore += answer;
            depressionQuestions++;
            break;
          case "anxiety":
            anxietyScore += answer;
            anxietyQuestions++;
            break;
          case "general":
            generalScore += answer;
            generalQuestions++;
            break;
        }
      });
      
      const depressionPercentage = depressionQuestions > 0 ? (depressionScore / (depressionQuestions * 3)) * 100 : 0;
      const anxietyPercentage = anxietyQuestions > 0 ? (anxietyScore / (anxietyQuestions * 3)) * 100 : 0;
      
      let generalWellbeing = 100;
      if (selectedType === 'depression') {
        generalWellbeing = 100 - depressionPercentage;
      } else if (selectedType === 'anxiety') {
        generalWellbeing = 100 - anxietyPercentage;
      } else {
        generalWellbeing = 100 - ((depressionPercentage + anxietyPercentage) / 2);
      }
      
      const getLevel = (score: number) => {
        if (score < 25) return "Minimal";
        if (score < 50) return "Mild";
        if (score < 75) return "Moderate";
        return "Severe";
      };
      
      const assessmentResults: AssessmentResults = {
        depression: {
          score: Math.round(depressionPercentage),
          level: getLevel(depressionPercentage)
        },
        anxiety: {
          score: Math.round(anxietyPercentage),
          level: getLevel(anxietyPercentage)
        },
        generalWellbeing: Math.round(generalWellbeing),
        completed: true,
        date: new Date().toISOString()
      };

      console.log("User authenticated:", !!user);
      console.log("Assessment results:", assessmentResults);
      
      // Save to Database if user is authenticated
      if (user) {
        console.log("Attempting to save assessment for user:", user.id);
        
        // Convert the result object to a proper stringified JSON
        const resultJson = JSON.stringify({
          depression: selectedType === 'anxiety' ? { score: 0, level: 'Not Tested' } : assessmentResults.depression,
          anxiety: selectedType === 'depression' ? { score: 0, level: 'Not Tested' } : assessmentResults.anxiety,
          generalWellbeing: assessmentResults.generalWellbeing,
          type: selectedType
        });
        
        // Save to condition_assessments table in database
        const { data, error } = await db.assessments.insert({
          user_id: user.id,
          condition_type: selectedType || 'mental_health',
          score: Math.round(selectedType === 'depression' ? depressionPercentage : selectedType === 'anxiety' ? anxietyPercentage : generalWellbeing),
          result: resultJson,
          answers: finalAnswers
        });
        
        console.log("Save response:", data, error);
        
        if (error) {
          console.error('Error saving assessment:', error);
          toast({
            title: "Error",
            description: "Failed to save assessment results. Please try again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Assessment saved",
            description: "Your mental health assessment has been saved",
          });
        }
      } else {
        console.log("No authenticated user found");
        toast({
          title: "Not logged in",
          description: "Please log in to save your assessment results",
          variant: "default",
        });
      }
      
      // For compatibility with existing code, still save to localStorage
      const existingUser = localStorage.getItem('nasake-user');
      if (existingUser) {
        const userObj = JSON.parse(existingUser);
        userObj.assessments = userObj.assessments || [];
        userObj.assessments.unshift(assessmentResults);
        localStorage.setItem('nasake-user', JSON.stringify(userObj));
      }
      
      setResults(assessmentResults);
      setIsCompleted(true);
    } catch (error) {
      console.error("Assessment submission error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const resetAssessment = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setCurrentAnswer("");
    setIsCompleted(false);
    setResults(null);
    setSelectedType(null);
  };
  
  if (selectedType === null) {
    return (
      <Card className="nasake-card w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-center">Select Assessment Type</CardTitle>
          <CardDescription className="text-center">
            Choose the type of mental health assessment you would like to take
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 pt-4">
          <button
            onClick={() => setSelectedType('full')}
            className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 rounded-xl border border-border bg-white dark:bg-card hover:border-nasake-primary hover:bg-nasake-soft/10 transition-all text-left w-full group"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                <Brain className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-semibold text-lg">Comprehensive Mental Health Assessment</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Full screening for depression, anxiety, and overall mental wellbeing. (10 questions)
                </p>
              </div>
            </div>
            <div className="flex items-center text-sm font-medium text-nasake-primary mt-3 md:mt-0">
              <span>Take Assessment</span>
              <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          <button
            onClick={() => setSelectedType('depression')}
            className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 rounded-xl border border-border bg-white dark:bg-card hover:border-blue-500 hover:bg-blue-50/10 dark:hover:bg-blue-950/10 transition-all text-left w-full group"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <Smile className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-semibold text-lg">Depression Screening (PHQ)</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Screen specifically for low mood, energy levels, and symptoms of depression. (5 questions)
                </p>
              </div>
            </div>
            <div className="flex items-center text-sm font-medium text-blue-600 mt-3 md:mt-0">
              <span>Take Assessment</span>
              <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          <button
            onClick={() => setSelectedType('anxiety')}
            className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 rounded-xl border border-border bg-white dark:bg-card hover:border-emerald-500 hover:bg-emerald-50/10 dark:hover:bg-emerald-950/10 transition-all text-left w-full group"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-semibold text-lg">Anxiety Screening (GAD)</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Screen specifically for stress levels, excessive worry, and symptoms of anxiety. (4 questions)
                </p>
              </div>
            </div>
            <div className="flex items-center text-sm font-medium text-emerald-600 mt-3 md:mt-0">
              <span>Take Assessment</span>
              <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = activeQuestions[currentQuestionIndex];
  
  return (
    <Card className="nasake-card w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">
          {selectedType === 'full' ? 'Comprehensive Mental Health Assessment' :
           selectedType === 'depression' ? 'Depression Screening (PHQ)' :
           'Anxiety Screening (GAD)'}
        </CardTitle>
        <CardDescription>
          {selectedType === 'full' ? 'This assessment helps identify symptoms of anxiety and depression' :
           selectedType === 'depression' ? 'This screening helps identify symptoms of depression' :
           'This screening helps identify symptoms of anxiety'}
        </CardDescription>
      </CardHeader>
      
      {!isCompleted ? (
        <>
          <CardContent className="space-y-6">
            <div>
              <Progress value={progress} className="h-2 bg-nasake-soft" />
              <p className="text-sm text-muted-foreground mt-1">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </p>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{currentQuestion.text}</h3>
              
              <RadioGroup value={currentAnswer} onValueChange={setCurrentAnswer}>
                {currentQuestion.options.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2 py-2">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value} className="cursor-pointer w-full">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </CardContent>
          
          <CardFooter>
            <Button 
              className="w-full nasake-button bg-nasake-primary hover:bg-nasake-secondary"
              onClick={handleNext}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : currentQuestionIndex < totalQuestions - 1 ? (
                <>
                  Next Question
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                "Complete Assessment"
              )}
            </Button>
          </CardFooter>
        </>
      ) : (
        <CardContent className="space-y-6">
          <div className="text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
            <h3 className="mt-2 text-xl font-semibold">Assessment Complete</h3>
            <p className="text-muted-foreground">
              Here are your results
            </p>
          </div>
          
          <div className="space-y-4">
            {selectedType !== 'anxiety' && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <h4 className="font-medium">Depression Symptoms</h4>
                  <span 
                    className={`text-sm px-2 py-1 rounded-full ${
                      results?.depression.level === "Minimal" ? "bg-green-100 text-green-800" :
                      results?.depression.level === "Mild" ? "bg-yellow-100 text-yellow-800" :
                      results?.depression.level === "Moderate" ? "bg-orange-100 text-orange-800" :
                      "bg-red-100 text-red-800"
                    }`}
                  >
                    {results?.depression.level}
                  </span>
                </div>
                <Progress 
                  value={results?.depression.score || 0} 
                  className={`h-2 ${
                    results?.depression.level === "Minimal" ? "[&>div]:bg-green-500" :
                    results?.depression.level === "Mild" ? "[&>div]:bg-yellow-500" :
                    results?.depression.level === "Moderate" ? "[&>div]:bg-orange-500" :
                    "[&>div]:bg-red-500"
                  }`}
                />
              </div>
            )}
            
            {selectedType !== 'depression' && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <h4 className="font-medium">Anxiety Symptoms</h4>
                  <span 
                    className={`text-sm px-2 py-1 rounded-full ${
                      results?.anxiety.level === "Minimal" ? "bg-green-100 text-green-800" :
                      results?.anxiety.level === "Mild" ? "bg-yellow-100 text-yellow-800" :
                      results?.anxiety.level === "Moderate" ? "bg-orange-100 text-orange-800" :
                      "bg-red-100 text-red-800"
                    }`}
                  >
                    {results?.anxiety.level}
                  </span>
                </div>
                <Progress 
                  value={results?.anxiety.score || 0} 
                  className={`h-2 ${
                    results?.anxiety.level === "Minimal" ? "[&>div]:bg-green-500" :
                    results?.anxiety.level === "Mild" ? "[&>div]:bg-yellow-500" :
                    results?.anxiety.level === "Moderate" ? "[&>div]:bg-orange-500" :
                    "[&>div]:bg-red-500"
                  }`}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <h4 className="font-medium">
                  {selectedType === 'depression' ? 'Depression-related Well-being' :
                   selectedType === 'anxiety' ? 'Anxiety-related Well-being' :
                   'Overall Well-being'}
                </h4>
                <span className="text-sm px-2 py-1 rounded-full bg-nasake-soft text-nasake-primary">
                  {results?.generalWellbeing}%
                </span>
              </div>
              <Progress 
                value={results?.generalWellbeing || 0} 
                className="h-2 [&>div]:bg-nasake-primary"
              />
            </div>
            
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <h5 className="font-medium text-amber-800">Important Note</h5>
                <p className="text-sm text-amber-700">
                  This assessment is not a clinical diagnosis. If you're experiencing distress, please consult with a healthcare professional.
                </p>
              </div>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            className="w-full nasake-button" 
            onClick={resetAssessment}
          >
            Take Assessment Again
          </Button>
        </CardContent>
      )}
    </Card>
  );
};
