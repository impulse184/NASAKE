
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ColorShift } from '@/components/games/ColorShift';
import { NumberTrail } from '@/components/games/NumberTrail';
import { useAuth } from '@/contexts/AuthContext';
import { getUserGameSessions, getCognitiveInsights, GameSession } from '@/utils/gameService';
import { Brain, Sparkles, Loader2, Dna } from 'lucide-react';

const Games = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('games');
  const [gameHistory, setGameHistory] = useState<GameSession[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (isLoading) return;
    
    if (!user) {
      navigate('/');
      return;
    }
    
    const fetchData = async () => {
      setLoading(true);
      const [historyResult, insightsResult] = await Promise.all([
        getUserGameSessions(),
        getCognitiveInsights(),
      ]);
      
      if (historyResult.data) {
        setGameHistory(historyResult.data);
      }
      
      if (insightsResult.data) {
        setInsights(insightsResult.data);
      }
      
      setLoading(false);
    };
    
    fetchData();
  }, [user, isLoading, navigate]);
  
  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit' 
    }).format(date);
  };
  
  return (
    <Layout>
      <div className="container px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Cognitive Games</h1>
          <p className="text-muted-foreground">
            Challenge your brain with games that enhance cognitive function
          </p>
        </header>
        
        <Tabs defaultValue="games" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="games">Games</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>
          
          <div className="mt-6">
            <TabsContent value="games" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-accent/50">
                  <CardHeader className="pb-2">
                    <CardTitle>Color Shift</CardTitle>
                    <CardDescription>
                      Test your selective attention and response inhibition
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ColorShift />
                  </CardContent>
                </Card>
                
                <Card className="bg-accent/50">
                  <CardHeader className="pb-2">
                    <CardTitle>Number Trail</CardTitle>
                    <CardDescription>
                      Challenge your working memory and attention span
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <NumberTrail />
                  </CardContent>
                </Card>
              </div>
              
              <div className="bg-nasake-soft/30 rounded-xl p-6 border border-nasake-soft">
                <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                  <Brain className="h-5 w-5 text-nasake-primary" />
                  About Cognitive Training
                </h3>
                <p className="text-muted-foreground mb-4">
                  These cognitive games are designed to assess and improve different aspects of mental function:
                </p>
                <ul className="space-y-2 list-disc pl-5">
                  <li><span className="font-medium">Color Shift</span> - Improves selective attention and response inhibition, which are important for focusing on relevant information while ignoring distractions.</li>
                  <li><span className="font-medium">Number Trail</span> - Enhances working memory and sequencing abilities, helping you maintain and manipulate information over short periods.</li>
                </ul>
                <p className="mt-4 text-sm text-muted-foreground">
                  Regular practice can help strengthen these cognitive abilities over time. Your results are analyzed alongside assessment data to provide insights into your mental wellbeing.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="history">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-nasake-primary" />
                </div>
              ) : gameHistory.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    You haven't played any games yet. Start playing to see your history!
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Recent Game History</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {gameHistory.slice(0, 10).map((session, index) => (
                      <Card key={index} className="overflow-hidden">
                        <div className={`h-2 ${session.game_type === 'color_shift' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-base">
                              {session.game_type === 'color_shift' ? 'Color Shift' : 'Number Trail'}
                            </CardTitle>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(session.created_at as string)}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <p className="text-muted-foreground">Score</p>
                              <p className="font-medium">{session.score}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Accuracy</p>
                              <p className="font-medium">{Math.round(session.accuracy * 100)}%</p>
                            </div>
                            {session.game_type === 'color_shift' ? (
                              <div>
                                <p className="text-muted-foreground">Reaction</p>
                                <p className="font-medium">{session.reaction_time_ms}ms</p>
                              </div>
                            ) : (
                              <div>
                                <p className="text-muted-foreground">Sequence</p>
                                <p className="font-medium">{session.sequence_length}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="insights">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-nasake-primary" />
                </div>
              ) : !insights ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    Play some games to generate cognitive insights!
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  <Card className="border-none nasake-card overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-nasake-primary to-nasake-secondary"></div>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-nasake-primary" />
                        Cognitive Profile
                      </CardTitle>
                      <CardDescription>
                        Analysis based on your game performance
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-accent/50 rounded-lg p-4">
                            <div className="text-sm font-medium text-muted-foreground mb-1">Attention & Focus</div>
                            <div className="text-lg font-semibold">
                              {insights.avgColorShiftScore > 75 ? 'Excellent' : 
                               insights.avgColorShiftScore > 50 ? 'Good' : 
                               insights.avgColorShiftScore > 25 ? 'Average' : 'Needs Practice'}
                            </div>
                            <div className="w-full bg-muted rounded-full h-2 mt-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full" 
                                style={{ width: `${Math.min(100, Math.max(0, insights.avgColorShiftScore))}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          <div className="bg-accent/50 rounded-lg p-4">
                            <div className="text-sm font-medium text-muted-foreground mb-1">Working Memory</div>
                            <div className="text-lg font-semibold">
                              {insights.maxSequenceLength > 7 ? 'Excellent' : 
                               insights.maxSequenceLength > 5 ? 'Good' : 
                               insights.maxSequenceLength > 3 ? 'Average' : 'Needs Practice'}
                            </div>
                            <div className="w-full bg-muted rounded-full h-2 mt-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full" 
                                style={{ width: `${Math.min(100, Math.max(0, (insights.maxSequenceLength / 10) * 100))}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          <div className="bg-accent/50 rounded-lg p-4">
                            <div className="text-sm font-medium text-muted-foreground mb-1">Processing Speed</div>
                            <div className="text-lg font-semibold">
                              {insights.avgReactionTime < 500 ? 'Excellent' : 
                               insights.avgReactionTime < 800 ? 'Good' : 
                               insights.avgReactionTime < 1200 ? 'Average' : 'Needs Practice'}
                            </div>
                            <div className="w-full bg-muted rounded-full h-2 mt-2">
                              <div 
                                className="bg-purple-500 h-2 rounded-full" 
                                style={{ width: `${Math.min(100, Math.max(0, 100 - (insights.avgReactionTime / 20)))}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="border-t pt-4 space-y-2">
                          <h4 className="font-medium">Recent Progress</h4>
                          <p className="text-muted-foreground">{insights.recentProgress}</p>
                          
                          {insights.latestAssessment && (
                            <div className="bg-nasake-soft/30 p-4 rounded-lg mt-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Dna className="h-5 w-5 text-nasake-primary" />
                                <h4 className="font-medium">Cognitive-Mental Health Correlation</h4>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Your cognitive performance data is analyzed alongside your mental health assessments 
                                to provide a more comprehensive understanding of your wellbeing.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <div className="bg-nasake-soft/30 rounded-xl p-6 border border-nasake-soft">
                    <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                      <Brain className="h-5 w-5 text-nasake-primary" />
                      What These Insights Mean
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Your cognitive profile is based on your performance in our games and can offer insights into your mental wellbeing:
                    </p>
                    <ul className="space-y-2 list-disc pl-5">
                      <li><span className="font-medium">Attention & Focus</span> - Reflects your ability to concentrate on tasks and ignore distractions, which may be affected during periods of stress or anxiety.</li>
                      <li><span className="font-medium">Working Memory</span> - Shows how well you can hold and manipulate information, which can be impacted by depression or overwhelm.</li>
                      <li><span className="font-medium">Processing Speed</span> - Indicates how quickly you process information and react, often slower during mental fatigue or low mood.</li>
                    </ul>
                    <p className="mt-4 text-sm text-muted-foreground">
                      Regular cognitive training may help maintain and improve these abilities, potentially supporting your overall mental health.
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Games;
