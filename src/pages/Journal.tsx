
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { MoodTracker } from '@/components/MoodTracker';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/db';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
  Calendar,
  Search,
  Smile,
  SmilePlus,
  Meh,
  Frown,
  XCircle,
  Filter,
  SlidersHorizontal,
  Loader2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

const Journal = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [entries, setEntries] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchEntries = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await db.journal.list(user.id);
          
        if (error) throw error;
        
        setEntries(data || []);
      } catch (error) {
        console.error('Error fetching journal entries:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEntries();
  }, [user]);
  
  // Filter entries based on search query
  const filteredEntries = entries.filter(entry => 
    entry.text.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Mood icon mapping
  const getMoodIcon = (mood: number | null, analysis: any) => {
    if (mood === 5) return <SmilePlus className="h-5 w-5 text-green-500" />;
    if (mood === 4) return <Smile className="h-5 w-5 text-emerald-500" />;
    if (mood === 3) return <Meh className="h-5 w-5 text-amber-500" />;
    if (mood === 2) return <Frown className="h-5 w-5 text-orange-500" />;
    if (mood === 1) return <XCircle className="h-5 w-5 text-red-500" />;
    
    // If no mood is selected, use sentiment analysis
    if (analysis) {
      if (analysis.sentiment === 'positive') return <Smile className="h-5 w-5 text-emerald-500" />;
      if (analysis.sentiment === 'negative') return <Frown className="h-5 w-5 text-orange-500" />;
    }
    
    return <Meh className="h-5 w-5 text-amber-500" />;
  };
  
  return (
    <ProtectedRoute>
      <Layout>
        <div className="container px-4 py-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold">Mood Journal</h1>
            <p className="text-muted-foreground">
              Track your moods and thoughts to improve your mental wellbeing
            </p>
          </header>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7">
              <MoodTracker onEntryAdded={() => {
                // Refresh entries after a new one is added
                const fetchEntries = async () => {
                  try {
                    const { data, error } = await db.journal.list(user.id);
                      
                    if (error) throw error;
                    setEntries(data || []);
                  } catch (error) {
                    console.error('Error refreshing journal entries:', error);
                  }
                };
                
                fetchEntries();
              }} />
            </div>
            
            <div className="lg:col-span-5">
              <Card className="nasake-card border-none">
                <CardHeader className="border-b">
                  <div className="flex justify-between items-center">
                    <CardTitle>Journal History</CardTitle>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="icon" className="rounded-full">
                        <Filter className="h-4 w-4" />
                        <span className="sr-only">Filter</span>
                      </Button>
                      <Button variant="outline" size="icon" className="rounded-full">
                        <SlidersHorizontal className="h-4 w-4" />
                        <span className="sr-only">Settings</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <div className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search journal entries..."
                      className="pl-9 pr-4 py-2 w-full rounded-full border bg-transparent focus:outline-none focus:ring-2 focus:ring-nasake-soft"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <CardContent className="max-h-[600px] overflow-y-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-nasake-primary" />
                    </div>
                  ) : filteredEntries.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-muted-foreground">No journal entries yet</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Start your journey by adding your first entry
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredEntries.map((entry, index) => (
                        <div key={entry.id} className="p-4 rounded-xl bg-accent hover:bg-muted/50 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center">
                              {getMoodIcon(entry.mood, entry.analysis)}
                              <div className="ml-2 text-sm font-medium">
                                {entry.mood === 5 ? "Amazing" :
                                entry.mood === 4 ? "Good" :
                                entry.mood === 3 ? "Okay" :
                                entry.mood === 2 ? "Bad" :
                                entry.mood === 1 ? "Terrible" :
                                entry.analysis?.sentiment === 'positive' ? "Positive" :
                                entry.analysis?.sentiment === 'negative' ? "Negative" :
                                "Neutral"}
                              </div>
                            </div>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3 mr-1" />
                              {format(new Date(entry.created_at), 'MMM d, yyyy')}
                            </div>
                          </div>
                          <p className="text-sm line-clamp-3">{entry.text}</p>
                          {entry.analysis && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              <div className="text-xs bg-nasake-soft text-nasake-primary px-2 py-0.5 rounded-full">
                                {entry.analysis.emotion}
                              </div>
                              <div 
                                className={`text-xs px-2 py-0.5 rounded-full ${
                                  entry.analysis.sentiment === 'positive' 
                                    ? 'bg-green-100 text-green-800' 
                                    : entry.analysis.sentiment === 'negative'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {entry.analysis.sentiment}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default Journal;
