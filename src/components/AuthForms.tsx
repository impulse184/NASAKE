import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { db } from "@/lib/db";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface User {
  email: string;
  password: string;
  name?: string;
}

export const AuthForms = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<User>({
    email: '',
    password: '',
    name: '',
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setConfirmMessage(null);
    
    try {
      if (isLogin) {
        const { data, error } = await db.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        
        if (error) throw error;
        
        if (data?.session) {
          toast({
            title: "Welcome back!",
            description: "You've successfully logged in.",
          });
          
          // Redirect to dashboard
          navigate('/dashboard');
        }
      } else {
        const { data, error } = await db.auth.signUp(
          formData.email,
          formData.password,
          formData.name
        );
        
        if (error) throw error;
        
        if (db.isCloudMode()) {
          setConfirmMessage("Account created successfully! You can now log in.");
          toast({
            title: "Account created!",
            description: "Your account has been created successfully. Please log in.",
          });
          setIsLogin(true);
        } else {
          toast({
            title: "Account created!",
            description: "Your local account has been created successfully.",
          });
          // LocalMode logs them in immediately
          navigate('/dashboard');
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto nasake-card border-none">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-center">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </CardTitle>
        <CardDescription className="text-center">
          {isLogin 
            ? 'Enter your credentials to access your account' 
            : 'Fill out the form below to create your account'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {confirmMessage && (
          <Alert className="mb-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <AlertDescription>
              {confirmMessage}
            </AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter your name"
                value={formData.name || ''}
                onChange={handleChange}
                className="nasake-input"
                required
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="hello@example.com"
              value={formData.email}
              onChange={handleChange}
              className="nasake-input"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className="nasake-input"
              required
              minLength={6}
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full nasake-button bg-nasake-primary hover:bg-nasake-secondary"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button
          variant="link"
          className="text-nasake-primary hover:text-nasake-secondary"
          onClick={() => {
            setIsLogin(!isLogin);
            setConfirmMessage(null);
          }}
        >
          {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
        </Button>
      </CardFooter>
    </Card>
  );
};
