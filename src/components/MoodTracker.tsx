
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { db } from "@/lib/db";
import { useAuth } from '@/contexts/AuthContext';
import { 
  SmilePlus, Smile, Meh, 
  Frown, XCircle, Calendar, 
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { analyzeMood } from '@/utils/api';

const moods = [
  { value: 5, label: "Amazing", icon: SmilePlus, color: "text-green-500" },
  { value: 4, label: "Good", icon: Smile, color: "text-emerald-500" },
  { value: 3, label: "Okay", icon: Meh, color: "text-amber-500" },
  { value: 2, label: "Bad", icon: Frown, color: "text-orange-500" },
  { value: 1, label: "Terrible", icon: XCircle, color: "text-red-500" },
];

interface MoodTrackerProps {
  onEntryAdded?: () => void;
}

export const MoodTracker: React.FC<MoodTrackerProps> = ({ onEntryAdded }) => {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [journalText, setJournalText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user, session } = useAuth();
  
  const handleSubmit = async () => {
    if (!journalText.trim()) {
      toast({
        title: "Journal entry required",
        description: "Please write something about your day",
        variant: "destructive",
      });
      return;
    }
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save your journal entry",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log("Analyzing journal entry...");
      const analysis = await analyzeMood(journalText);
      
      const { error, data } = await db.journal.insert({
        user_id: user.id,
        text: journalText,
        mood: selectedMood,
        analysis: {
          emotion: analysis.emotion,
          sentiment: analysis.sentiment,
          score: analysis.score,
          emotions: analysis.emotions // Store detailed emotion distribution
        },
      });
      
      if (error) {
        console.error("Error saving journal entry:", error);
        throw error;
      }
      
      console.log("Journal entry saved with emotion analysis:", data);
      
      toast({
        title: "Journal entry saved",
        description: `Your mood has been recorded as ${analysis.emotion} for ${format(new Date(), 'MMMM d, yyyy')}`,
      });
      
      setJournalText('');
      setSelectedMood(null);
      
      if (onEntryAdded) {
        onEntryAdded();
      }
      
    } catch (error: any) {
      console.error('Error saving journal entry:', error);
      toast({
        title: "Error saving entry",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card className="nasake-card w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-semibold">How are you feeling?</CardTitle>
            <CardDescription className="flex items-center mt-1">
              <Calendar size={16} className="mr-1" />
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center space-x-4">
          {moods.map((mood) => {
            const Icon = mood.icon;
            return (
              <button
                key={mood.value}
                className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                  selectedMood === mood.value 
                    ? "bg-nasake-soft scale-110" 
                    : "hover:bg-nasake-soft/50"
                }`}
                onClick={() => setSelectedMood(mood.value)}
                type="button"
              >
                <Icon 
                  size={28} 
                  className={`${mood.color} ${
                    selectedMood === mood.value ? "animate-bounce" : ""
                  }`} 
                />
                <span className="text-sm mt-1">{mood.label}</span>
              </button>
            );
          })}
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Write about your day</h3>
          <Textarea
            placeholder="How was your day? What made you happy or sad today? Share your thoughts..."
            className="nasake-input min-h-[150px]"
            value={journalText}
            onChange={(e) => setJournalText(e.target.value)}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full nasake-button bg-nasake-primary hover:bg-nasake-secondary"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Save Journal Entry"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
