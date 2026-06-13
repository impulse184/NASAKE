
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/db";
import {
  BarChart3,
  Calendar,
  Clock,
  BrainCircuit,
  LineChart,
  BookOpenCheck,
  ArrowRight,
} from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
import { BreathingSpace } from '@/components/BreathingSpace';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (isLoading) return;
    
    if (!user) {
      navigate('/');
      return;
    }
    
    const fetchData = async () => {
      // Fetch profile
      const { data: profileData } = await db.profiles.get(user.id);
      
      if (profileData) {
        setProfile(profileData);
      }
      
      // Fetch journal entries
      const { data: journalData } = await db.journal.list(user.id);
      
      if (journalData) {
        setJournalEntries(journalData);
      }
      
      // Fetch assessments
      const { data: assessmentData } = await db.assessments.list(user.id);
      
      if (assessmentData) {
        // Transform assessment data to match expected format
        const formattedAssessments = assessmentData.map(assessment => {
          let assessmentResult = { depression: { level: 'Minimal', score: 0 }, anxiety: { level: 'Minimal', score: 0 }, generalWellbeing: 100 };
          try {
            if (typeof assessment.result === 'string') {
              assessmentResult = JSON.parse(assessment.result);
            } else if (assessment.result) {
              assessmentResult = assessment.result as any;
            }
          } catch (e) {
            console.warn("Error parsing assessment result", e);
          }
          
          return {
            date: assessment.created_at,
            generalWellbeing: assessmentResult.generalWellbeing || Math.round((100 - (assessment.score / 30) * 100)),
            depression: {
              level: assessmentResult.depression?.level || getLevel(assessment.result),
              score: assessmentResult.depression?.score || assessment.score
            },
            anxiety: {
              level: assessmentResult.anxiety?.level || getLevel(assessment.result),
              score: assessmentResult.anxiety?.score || assessment.score
            }
          };
        });
        
        setAssessments(formattedAssessments);
      }
      
      setLoading(false);
    };
    
    fetchData();
  }, [user, isLoading, navigate]);
  
  // Helper function to determine level based on score or result
  const getLevel = (result: string) => {
    if (!result) return "Minimal";
    
    const lowercaseResult = result.toLowerCase();
    if (lowercaseResult.includes('severe')) return "Severe";
    if (lowercaseResult.includes('moderate')) return "Moderate";
    if (lowercaseResult.includes('mild')) return "Mild";
    return "Minimal";
  };
  
  const calculateStreak = () => {
    if (!journalEntries.length) return 0;
    
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = format(subDays(today, i), 'yyyy-MM-dd');
      const entryForDay = journalEntries.find(entry => {
        if (!entry.created_at) return false;
        return format(new Date(entry.created_at), 'yyyy-MM-dd') === date;
      });
      
      if (!entryForDay) break;
      streak += 1;
    }
    
    return streak;
  };
  
  const latestAssessment = assessments.length > 0 ? assessments[0] : null;
  
  const getMoodDistribution = () => {
    if (!journalEntries.length) return { positive: 33, neutral: 33, negative: 34 };
    
    let positive = 0;
    let neutral = 0;
    let negative = 0;
    
    journalEntries.forEach(entry => {
      if (entry.mood) {
        if (entry.mood >= 4) {
          positive += 1;
        } else if (entry.mood === 3) {
          neutral += 1;
        } else {
          negative += 1;
        }
      } else if (entry.analysis) {
        if (entry.analysis.sentiment === 'positive') {
          positive += 1;
        } else if (entry.analysis.sentiment === 'neutral') {
          neutral += 1;
        } else {
          negative += 1;
        }
      }
    });
    
    const total = positive + neutral + negative || 1;
    
    return {
      positive: Math.round((positive / total) * 100),
      neutral: Math.round((neutral / total) * 100),
      negative: Math.round((negative / total) * 100),
    };
  };
  
  const moodDistribution = getMoodDistribution();
  const streak = calculateStreak();
  
  if (loading && isLoading) {
    return (
      <Layout>
        <div className="container px-4 py-8">
          <div className="flex items-center justify-center h-32">
            <p>Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Welcome back, {profile?.name || user?.email || 'Friend'}</h1>
          <p className="text-muted-foreground">
            Here's your mental wellness overview for today
          </p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <Card className="nasake-card border-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium text-muted-foreground flex items-center">
                    <Calendar className="mr-2 h-5 w-5 text-nasake-primary" />
                    Streak
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end">
                    <div className="text-3xl font-bold">{streak}</div>
                    <div className="text-sm text-muted-foreground ml-1 mb-1">days</div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {streak > 0 
                      ? `Keep going! You're doing great.` 
                      : `Start your streak by adding a journal entry!`}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="nasake-card border-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium text-muted-foreground flex items-center">
                    <BookOpenCheck className="mr-2 h-5 w-5 text-nasake-primary" />
                    Journal Entries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end">
                    <div className="text-3xl font-bold">{journalEntries.length}</div>
                    <div className="text-sm text-muted-foreground ml-1 mb-1">entries</div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {journalEntries.length === 0
                      ? "Start journaling to track your moods"
                      : "Keep tracking to gain more insights"}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="nasake-card border-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium text-muted-foreground flex items-center">
                    <BrainCircuit className="mr-2 h-5 w-5 text-nasake-primary" />
                    Overall Well-being
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end">
                    <div className="text-3xl font-bold">
                      {latestAssessment ? latestAssessment.generalWellbeing : "--"}
                    </div>
                    <div className="text-sm text-muted-foreground ml-1 mb-1">%</div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {latestAssessment 
                      ? `Based on your latest assessment` 
                      : `Take an assessment to see your score`}
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <Card className="nasake-card border-none">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Mood Analysis</CardTitle>
                    <CardDescription>
                      Your mood patterns based on journal entries
                    </CardDescription>
                  </div>
                  <BarChart3 className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                {journalEntries.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="text-muted-foreground mb-4">No journal entries yet</div>
                    <Button 
                      onClick={() => navigate('/journal')}
                      className="nasake-button bg-nasake-primary hover:bg-nasake-secondary text-white"
                    >
                      Create Your First Entry
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                      <div className="h-44 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Positive', value: moodDistribution.positive || 0, color: '#10B981' },
                                { name: 'Neutral', value: moodDistribution.neutral || 0, color: '#33C3F0' },
                                { name: 'Negative', value: moodDistribution.negative || 0, color: '#EF4444' }
                              ].filter(d => d.value > 0)}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={70}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {[
                                { name: 'Positive', value: moodDistribution.positive || 0, color: '#10B981' },
                                { name: 'Neutral', value: moodDistribution.neutral || 0, color: '#33C3F0' },
                                { name: 'Negative', value: moodDistribution.negative || 0, color: '#EF4444' }
                              ].filter(d => d.value > 0).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value: any) => [`${value}%`, 'Percentage']}
                              contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Positive</span>
                            <span>{moodDistribution.positive}%</span>
                          </div>
                          <Progress value={moodDistribution.positive} className="h-1.5 bg-secondary [&>div]:bg-emerald-500" />
                        </div>
                        
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-nasake-skyBlue" />Neutral</span>
                            <span>{moodDistribution.neutral}%</span>
                          </div>
                          <Progress value={moodDistribution.neutral} className="h-1.5 bg-secondary [&>div]:bg-nasake-skyBlue" />
                        </div>
                        
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500" />Negative</span>
                            <span>{moodDistribution.negative}%</span>
                          </div>
                          <Progress value={moodDistribution.negative} className="h-1.5 bg-secondary [&>div]:bg-red-500" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-6 pt-4 border-t">
                      <div className="text-xs text-muted-foreground">
                        Based on {journalEntries.length} journal entries
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-nasake-primary hover:text-nasake-secondary hover:bg-nasake-soft flex items-center text-xs"
                        onClick={() => navigate('/insights')}
                      >
                        View detailed insights
                        <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-4">
            <Card className="nasake-card border-none mb-6">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Mental Health Assessment</CardTitle>
                  <LineChart className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                {latestAssessment ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <div className="text-sm text-muted-foreground">Depression Symptoms</div>
                        <div className="text-sm font-medium">{latestAssessment.depression.level}</div>
                      </div>
                      <Progress 
                        value={latestAssessment.depression.score} 
                        className={`h-2 bg-secondary ${
                          latestAssessment.depression.level === "Minimal" ? "[&>div]:bg-green-500" :
                          latestAssessment.depression.level === "Mild" ? "[&>div]:bg-yellow-500" :
                          latestAssessment.depression.level === "Moderate" ? "[&>div]:bg-orange-500" :
                          "[&>div]:bg-red-500"
                        }`}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <div className="text-sm text-muted-foreground">Anxiety Symptoms</div>
                        <div className="text-sm font-medium">{latestAssessment.anxiety.level}</div>
                      </div>
                      <Progress 
                        value={latestAssessment.anxiety.score} 
                        className={`h-2 bg-secondary ${
                          latestAssessment.anxiety.level === "Minimal" ? "[&>div]:bg-green-500" :
                          latestAssessment.anxiety.level === "Mild" ? "[&>div]:bg-yellow-500" :
                          latestAssessment.anxiety.level === "Moderate" ? "[&>div]:bg-orange-500" :
                          "[&>div]:bg-red-500"
                        }`}
                      />
                    </div>
                    
                    <div className="pt-2 flex items-center justify-between">
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Clock className="mr-1 h-4 w-4" />
                        {format(new Date(latestAssessment.date), 'MMM d, yyyy')}
                      </div>
                      <Button 
                        variant="ghost" 
                        className="text-nasake-primary hover:text-nasake-secondary hover:bg-nasake-soft"
                        onClick={() => navigate('/assessment')}
                      >
                        Retake
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="text-muted-foreground mb-4">
                      No assessment data yet
                    </div>
                    <Button 
                      onClick={() => navigate('/assessment')}
                      className="nasake-button bg-nasake-primary hover:bg-nasake-secondary text-white"
                    >
                      Take Assessment
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="mb-6">
              <BreathingSpace />
            </div>
            
            <Card className="nasake-card border-none">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {journalEntries.length === 0 && assessments.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="text-muted-foreground">No recent activity</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Start journaling or take an assessment
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[...(journalEntries || []), ...(assessments || [])]
                      .sort((a, b) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime())
                      .slice(0, 3)
                      .map((activity, i) => {
                        const isAssessment = 'generalWellbeing' in activity;
                        const date = new Date(activity.created_at || activity.date);
                        
                        return (
                          <div key={i} className="flex gap-3 items-start">
                            <div className={`p-2 rounded-md ${isAssessment ? 'bg-nasake-blue' : 'bg-nasake-soft'}`}>
                              {isAssessment ? (
                                <BrainCircuit className="h-4 w-4 text-nasake-secondary" />
                              ) : (
                                <BookOpenCheck className="h-4 w-4 text-nasake-primary" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-sm">
                                {isAssessment ? 'Completed mental health assessment' : 'Added journal entry'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {format(date, 'MMM d, yyyy h:mm a')}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
