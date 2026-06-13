
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { AuthForms } from '@/components/AuthForms';
import { useAuth } from '@/contexts/AuthContext';
import { 
  BrainCircuit,
  HeartHandshake,
  ShieldCheck,
  Trophy,
  SparkleIcon,
} from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  
  // Check if user is already logged in
  useEffect(() => {
    if (!isLoading && user) {
      navigate('/dashboard');
    }
  }, [navigate, user, isLoading]);
  
  const features = [
    {
      icon: BrainCircuit,
      title: "Mental Health Assessment",
      description: "Take our scientifically backed assessment to understand your mental wellbeing"
    },
    {
      icon: HeartHandshake,
      title: "Daily Mood Tracking",
      description: "Record your moods and thoughts with intelligent sentiment analysis"
    },
    {
      icon: ShieldCheck,
      title: "Private & Secure",
      description: "Your data is encrypted and never shared with third parties"
    },
    {
      icon: Trophy,
      title: "Progress Insights",
      description: "Track your mental health journey with visual analytics and insights"
    }
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-nasake-soft/50">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="nasake-gradient text-white font-display font-bold text-xl px-3 py-1 rounded-md">
            Nasake
          </span>
        </div>
      </header>
      
      <main className="container mx-auto px-4 pb-16">
        <div className="flex flex-col lg:flex-row gap-12 items-center mt-8 lg:mt-16">
          <div className="w-full lg:w-1/2 space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <SparkleIcon className="h-5 w-5 text-nasake-primary" />
              <span className="text-sm font-medium text-nasake-primary">
                Mental Wellness Made Simple
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight">
              Your Journey To Better <span className="text-nasake-primary">Mental Health</span>
            </h1>
            
            <p className="text-lg text-muted-foreground">
              Track your moods, understand your emotions, and improve your mental wellbeing with Nasake's 
              intelligent mood tracking and mental health assessments.
            </p>
            
            <div className="flex flex-wrap gap-4 pt-4">
              <Button className="nasake-button bg-nasake-primary hover:bg-nasake-secondary text-white px-6 py-2">
                Get Started
              </Button>
              <Button variant="outline" className="nasake-button px-6 py-2">
                Learn More
              </Button>
            </div>
          </div>
          
          <div className="w-full lg:w-1/2">
            <div className="bg-white dark:bg-card rounded-3xl shadow-2xl p-6 border border-border">
              <AuthForms />
            </div>
          </div>
        </div>
        
        <div className="mt-24">
          <h2 className="text-3xl font-display font-bold text-center mb-12">
            Why Choose <span className="text-nasake-primary">Nasake</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="bg-white dark:bg-card rounded-xl p-6 border border-border shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="h-12 w-12 rounded-lg nasake-gradient flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      
      <footer className="bg-white dark:bg-card border-t border-border">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <span className="nasake-gradient text-white font-display font-bold text-xl px-3 py-1 rounded-md">
                Nasake
              </span>
              <p className="text-sm text-muted-foreground mt-2">
                © {new Date().getFullYear()} Nasake. All rights reserved.
              </p>
            </div>
            
            <div className="flex space-x-6">
              <a href="#" className="text-muted-foreground hover:text-foreground">
                Privacy
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground">
                Terms
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
