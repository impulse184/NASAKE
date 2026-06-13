
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/db';
import {
  User,
  Mail,
  Key,
  Save,
  AlertTriangle,
  Shield,
} from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const { toast } = useToast();
  
  useEffect(() => {
    if (isLoading) return;
    
    if (!user) {
      navigate('/');
      return;
    }
    
    // Load profile data from Database
    const loadProfile = async () => {
      if (!user) return;
      
      const { data } = await db.profiles.get(user.id);
      
      if (data) {
        setFormData({
          ...formData,
          name: data.name || '',
          email: user.email || '',
        });
      } else {
        setFormData({
          ...formData,
          email: user.email || '',
        });
      }
    };
    
    loadProfile();
  }, [user, isLoading, navigate]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    // Update profile in Database
    const { error } = await db.profiles.update(user.id, {
      name: formData.name,
    });
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to update profile: " + error.message,
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Profile updated",
      description: "Your profile information has been updated successfully",
    });
  };
  
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Your new password and confirmation don't match",
        variant: "destructive",
      });
      return;
    }
    
    if (formData.newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Your password should be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }
    
    // Update password in Database
    const { error } = await db.auth.updateUser({
      password: formData.newPassword,
    });
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to update password: " + error.message,
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Password updated",
      description: "Your password has been updated successfully",
    });
    
    // Reset form fields
    setFormData({
      ...formData,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };
  
  return (
    <Layout>
      <div className="container px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and profile information
          </p>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7">
            <Card className="nasake-card border-none">
              <CardHeader>
                <div className="flex items-center">
                  <User className="h-5 w-5 text-nasake-primary mr-2" />
                  <CardTitle>Personal Information</CardTitle>
                </div>
                <CardDescription>
                  Update your profile information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={handleChange}
                      className="nasake-input"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="nasake-input"
                      disabled
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="nasake-button bg-nasake-primary hover:bg-nasake-secondary"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            <Card className="nasake-card border-none mt-6">
              <CardHeader>
                <div className="flex items-center">
                  <Key className="h-5 w-5 text-nasake-primary mr-2" />
                  <CardTitle>Password</CardTitle>
                </div>
                <CardDescription>
                  Update your password
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      placeholder="••••••••"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      className="nasake-input"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      placeholder="••••••••"
                      value={formData.newPassword}
                      onChange={handleChange}
                      className="nasake-input"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="nasake-input"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="nasake-button bg-nasake-primary hover:bg-nasake-secondary"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Update Password
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-5">
            <Card className="nasake-card border-none mb-6">
              <CardHeader>
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-nasake-primary mr-2" />
                  <CardTitle>Privacy & Data</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-nasake-soft rounded-lg">
                  <h3 className="text-lg font-medium flex items-center">
                    <Shield className="h-4 w-4 mr-2 text-nasake-primary" />
                    Data Security
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    At Nasake, we take your privacy seriously. Your journal entries and assessment
                    results are stored securely and never shared with third parties without your consent.
                  </p>
                </div>
                
                <div className={`p-4 rounded-lg border ${
                  db.isCloudMode()
                    ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                    : "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                }`}>
                  <h3 className="text-lg font-medium flex items-center">
                    <Shield className={`h-4 w-4 mr-2 ${
                      db.isCloudMode() ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"
                    }`} />
                    {db.isCloudMode() ? "Cloud Database Mode (Firebase)" : "Local Database Mode"}
                  </h3>
                  <p className={`text-sm mt-2 ${
                    db.isCloudMode() ? "text-emerald-700 dark:text-emerald-300" : "text-blue-700 dark:text-blue-300"
                  }`}>
                    {db.isCloudMode()
                      ? "Your data is stored and synced securely in your Cloud Database (Firebase Firestore)."
                      : "Your data is stored securely in your browser's local storage. Configure Firebase credentials in your environment variables to enable cloud sync."}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Account Actions</h3>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start text-muted-foreground">
                      Download My Data
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-muted-foreground">
                      Delete Account
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-xs text-muted-foreground">
                  By using Nasake, you agree to our Terms of Service and Privacy Policy.
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
