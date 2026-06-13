import React, { createContext, useContext, useEffect, useState } from 'react';
import { db, DbUser as User, DbSession as Session } from '@/lib/db';
import { useToast } from '@/components/ui/use-toast';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    console.log("Setting up auth state listener");
    
    // First set up auth state listener to avoid missing any auth events
    const { data: { subscription } } = db.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("Auth state changed:", event);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsLoading(false);
      }
    );

    // Then check for existing session
    db.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log("Got existing session:", currentSession ? "Yes" : "No");
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      console.log("Cleaning up auth subscription");
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      console.log("Signing out");
      await db.auth.signOut();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const value = {
    user,
    session,
    isLoading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
