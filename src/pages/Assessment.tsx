
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { AssessmentTest } from '@/components/AssessmentTest';
import { useAuth } from '@/contexts/AuthContext';

const Assessment = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/');
    }
  }, [user, isLoading, navigate]);
  
  return (
    <Layout>
      <div className="container px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Mental Health Assessment</h1>
          <p className="text-muted-foreground">
            Evaluate your mental wellbeing with our comprehensive assessment
          </p>
          {!user && (
            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
              Please log in to save your assessment results.
            </div>
          )}
        </header>
        
        <div className="max-w-3xl mx-auto">
          <AssessmentTest />
          
          <div className="mt-8 p-6 rounded-xl bg-nasake-soft/50 border border-nasake-soft">
            <h2 className="text-lg font-medium mb-2">About This Assessment</h2>
            <p className="text-muted-foreground mb-4">
              This assessment is based on clinically validated screening tools for anxiety and depression. 
              It's designed to help you understand your mental health status and identify areas 
              where you might need additional support.
            </p>
            <h3 className="text-md font-medium mb-1">Important Note</h3>
            <p className="text-sm text-muted-foreground">
              This tool is not meant to replace professional medical advice, diagnosis, or treatment. 
              If you're experiencing significant distress, please consult with a healthcare professional.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Assessment;
