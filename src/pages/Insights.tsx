
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/db';
import { format, parseISO, subDays } from 'date-fns';
import {
  BarChartHorizontal,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Calendar,
  ArrowRight,
  CalendarCheck2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const Insights = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
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
      // Fetch journal entries
      const { data: journalData, error: journalError } = await db.journal.list(user.id);
      
      if (journalData) {
        setJournalEntries(journalData);
      }
      
      // Fetch assessments
      const { data: assessmentData, error: assessmentError } = await db.assessments.list(user.id);
      
      if (assessmentData) {
        // Transform assessment data to match expected format
        const formattedAssessments = assessmentData.map(assessment => ({
          date: assessment.created_at,
          generalWellbeing: Math.round((100 - (assessment.score / 30) * 100)), // Assuming score is 0-30, lower is better
          depression: {
            level: getLevel(assessment.result),
            score: assessment.score
          },
          anxiety: {
            level: getLevel(assessment.result),
            score: assessment.score
          }
        }));
        
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
  
  // Group entries by emotion
  const emotionCounts: Record<string, number> = {};
  journalEntries.forEach((entry: any) => {
    if (entry.analysis?.emotion) {
      const emotion = entry.analysis.emotion;
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    }
  });
  
  // Sort emotions by count
  const sortedEmotions = Object.entries(emotionCounts)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5);
  
  // Calculate last 7 days of mood data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), i);
    const formattedDate = format(date, 'yyyy-MM-dd');
    
    // Find entry for this date
    const entry = journalEntries.find((e: any) => {
      if (!e.created_at) return false;
      return format(new Date(e.created_at), 'yyyy-MM-dd') === formattedDate;
    });
    
    let sentimentScore = 0.5; // Neutral default
    
    if (entry?.mood) {
      // Convert mood (1-5) to score (0-1)
      sentimentScore = (entry.mood - 1) / 4;
    } else if (entry?.analysis?.sentiment) {
      if (entry.analysis.sentiment === 'positive') sentimentScore = 0.8;
      else if (entry.analysis.sentiment === 'negative') sentimentScore = 0.2;
    }
    
    return {
      date: formattedDate,
      displayDate: format(date, 'MMM d'),
      score: sentimentScore,
    };
  }).reverse();
  
  if (loading && isLoading) {
    return (
      <Layout>
        <div className="container px-4 py-8">
          <div className="flex items-center justify-center h-32">
            <p>Loading insights...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Mood Insights</h1>
          <p className="text-muted-foreground">
            Analytics and insights based on your journal entries and assessments
          </p>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            {/* Mood Over Time */}
            <Card className="nasake-card border-none mb-6">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Mood Trends</CardTitle>
                  <LineChartIcon className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                {journalEntries.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="text-muted-foreground mb-2">No journal entries yet</div>
                    <button 
                      onClick={() => navigate('/journal')}
                      className="text-nasake-primary hover:text-nasake-secondary"
                    >
                      Add your first entry
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="h-64 w-full mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={last7Days}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#9b87f5" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#9b87f5" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                          <XAxis 
                            dataKey="displayDate" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                          />
                          <YAxis 
                            domain={[0, 1]}
                            ticks={[0.2, 0.5, 0.8]}
                            tickFormatter={(v) => v === 0.2 ? 'Neg' : v === 0.5 ? 'Neu' : 'Pos'}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                          />
                          <Tooltip 
                            formatter={(value: any) => [
                              value > 0.6 ? 'Positive' : value < 0.4 ? 'Negative' : 'Neutral',
                              'Sentiment'
                            ]}
                            contentStyle={{ 
                              background: 'hsl(var(--card))', 
                              border: '1px solid hsl(var(--border))', 
                              borderRadius: '8px',
                              color: 'hsl(var(--foreground))'
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="score" 
                            stroke="#9b87f5" 
                            strokeWidth={2.5}
                            fillOpacity={1} 
                            fill="url(#colorMood)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="flex justify-between items-center mt-4 pt-4 border-t">
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Last 7 days
                      </div>
                      <button 
                        className="text-sm text-nasake-primary hover:text-nasake-secondary flex items-center"
                        onClick={() => navigate('/journal')}
                      >
                        View all journal entries
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Common Emotions */}
            <Card className="nasake-card border-none">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Common Emotions</CardTitle>
                  <BarChartHorizontal className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                {sortedEmotions.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="text-muted-foreground">No emotion data yet</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Add journal entries to see your emotion patterns
                    </div>
                  </div>
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={sortedEmotions.map(([emotion, count]) => ({
                          name: emotion.charAt(0).toUpperCase() + emotion.slice(1),
                          percentage: Math.round((count / journalEntries.length) * 100)
                        }))}
                        margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                        <XAxis type="number" domain={[0, 100]} hide />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                          width={100}
                        />
                        <Tooltip 
                          formatter={(value: any) => [`${value}%`, 'Frequency']}
                          contentStyle={{ 
                            background: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))', 
                            borderRadius: '8px',
                            color: 'hsl(var(--foreground))'
                          }}
                        />
                        <Bar 
                          dataKey="percentage" 
                          fill="#7E69AB" 
                          radius={[0, 4, 4, 0]}
                          barSize={14}
                        >
                          {sortedEmotions.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={index === 0 ? '#9b87f5' : index === 1 ? '#8a76e1' : index === 2 ? '#7a65cc' : '#6954b8'} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-4 space-y-6">
            {/* Assessment History */}
            <Card className="nasake-card border-none">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Assessment History</CardTitle>
                  <CalendarCheck2 className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                {assessments.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="text-muted-foreground">No assessments taken yet</div>
                    <button 
                      onClick={() => navigate('/assessment')}
                      className="text-nasake-primary hover:text-nasake-secondary"
                    >
                      Take your first assessment
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assessments.slice(0, 5).map((assessment: any, index: number) => (
                      <div 
                        key={index} 
                        className="p-4 rounded-xl bg-accent hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-medium">Well-being Score: {assessment.generalWellbeing}%</div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(assessment.date), 'MMM d, yyyy')}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <div className="text-sm">
                            <span className="text-muted-foreground block">Depression:</span>
                            <span className={`font-medium ${
                              assessment.depression.level === "Minimal" ? "text-green-600" :
                              assessment.depression.level === "Mild" ? "text-amber-600" :
                              assessment.depression.level === "Moderate" ? "text-orange-600" :
                              "text-red-600"
                            }`}>
                              {assessment.depression.level}
                            </span>
                          </div>
                          
                          <div className="text-sm">
                            <span className="text-muted-foreground block">Anxiety:</span>
                            <span className={`font-medium ${
                              assessment.anxiety.level === "Minimal" ? "text-green-600" :
                              assessment.anxiety.level === "Mild" ? "text-amber-600" :
                              assessment.anxiety.level === "Moderate" ? "text-orange-600" :
                              "text-red-600"
                            }`}>
                              {assessment.anxiety.level}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {assessments.length > 5 && (
                      <div className="text-center pt-2">
                        <button 
                          className="text-sm text-nasake-primary hover:text-nasake-secondary"
                        >
                          View all assessments
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Mental Health Summary */}
            <Card className="nasake-card border-none">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Mood Distribution</CardTitle>
                  <PieChartIcon className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                {journalEntries.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="text-muted-foreground">No mood data yet</div>
                  </div>
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { 
                              name: 'Positive', 
                              value: journalEntries.filter((e: any) => e.mood ? e.mood >= 4 : e.analysis?.sentiment === 'positive').length,
                              color: '#10B981' 
                            },
                            { 
                              name: 'Neutral', 
                              value: journalEntries.filter((e: any) => e.mood ? e.mood === 3 : e.analysis?.sentiment === 'neutral').length,
                              color: '#33C3F0' 
                            },
                            { 
                              name: 'Negative', 
                              value: journalEntries.filter((e: any) => e.mood ? e.mood <= 2 : e.analysis?.sentiment === 'negative').length,
                              color: '#EF4444' 
                            }
                          ].filter(d => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, percent }) => `${name} (${Math.round(percent * 100)}%)`}
                        >
                          {[
                            { name: 'Positive', color: '#10B981' },
                            { name: 'Neutral', color: '#33C3F0' },
                            { name: 'Negative', color: '#EF4444' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: any) => [`${value} entries`, 'Count']}
                          contentStyle={{ 
                            background: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))', 
                            borderRadius: '8px',
                            color: 'hsl(var(--foreground))'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
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

export default Insights;
