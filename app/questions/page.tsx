"use client";
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './page.module.css';
import { Question } from '@/models/Question';
import PDFQuestionDisplay from './components/PdfQuestionDisplay';
import QuestionDisplay from './components/QuestionDisplay';
import { useUser } from 'context/UserContext';

// Define the router events type since Next.js App Router doesn't expose them directly
declare module 'next/navigation' {
  interface AppRouterInstance {
    events?: {
      on: (event: string, callback: (...args: any[]) => void) => void;
      off: (event: string, callback: (...args: any[]) => void) => void;
      emit: (event: string, ...args: any[]) => void;
    };
  }
}

// Add router events simulation for Next.js App Router
const useRouterEvents = (router: any) => {
  useEffect(() => {
    // Create a simple event emitter if it doesn't exist
    if (!router.events) {
      const events: {
        [key: string]: ((...args: any[]) => void)[];
      } = {};
      
      router.events = {
        on: (event: string, callback: (...args: any[]) => void) => {
          if (!events[event]) events[event] = [];
          events[event].push(callback);
        },
        off: (event: string, callback: (...args: any[]) => void) => {
          if (events[event]) {
            events[event] = events[event].filter(cb => cb !== callback);
          }
        },
        emit: (event: string, ...args: any[]) => {
          if (events[event]) {
            events[event].forEach(cb => cb(...args));
          }
        }
      };
    }
  }, [router]);
};

// Main page component that uses Suspense boundary
export default function QuestionsPage() {
  return (
    <div className={styles.questionsWrapper}>
      <Suspense fallback={<div>Loading questions...</div>}>
        <QuestionsContent />
      </Suspense>
    </div>
  );
}

// Extracted component that uses useSearchParams
function QuestionsContent() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [pdfQuestionSet, setPdfQuestionSet] = useState<{
    _id: string;
    question_pdf_blob: string;
    solution_pdf_blob: string;
    label: string;
  } | null>(null);
  const [questionSetLabel, setQuestionSetLabel] = useState<string>('Question Set');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  
  // Initialize router events
  useRouterEvents(router);

  useEffect(() => {
    // Check for required URL parameters
    const requiredParams = ['education_board', 'class', 'subject', 'topic', 'difficulty_level'];
    const missingParams = requiredParams.filter(param => !searchParams.has(param));
    const questionSetId = searchParams.get('q');
    const questionType = searchParams.get('type');
    const isPdfQuestionSet = questionType === 'pdf';

    if (missingParams.length > 0 && !questionSetId) {
      // Redirect to home page or a selection page if parameters are missing
      router.push('/');
      return;
    }

    const fetchQuestions = async () => {
      try {
        if (questionSetId && isPdfQuestionSet) {
          // Handle PDF question set loading
          const response = await fetch(`/api/question-set/${questionSetId}`, {
            method: 'GET',
          });

          if (!response.ok) {
            throw new Error('Failed to fetch PDF question set');
          }

          const data = await response.json();
          if (data.question_pdf_blob) {
            setPdfQuestionSet(data);
            setQuestions([]);
          } else {
            throw new Error('Invalid PDF question set format');
          }
        } else if (questionSetId) {
          // Handle regular question set loading
          const response = await fetch(`/api/question-set/${questionSetId}`, {
            method: 'GET',
          });

          if (!response.ok) {
            throw new Error('Failed to fetch question set');
          }

          const data = await response.json();
          setQuestions(data.questions || data);
          if (data.label) {
            setQuestionSetLabel(data.label);
          }
          setPdfQuestionSet(null);
        } else {
          // Build parameters object from search params for regular filtering
          const paramObject: Record<string, string | boolean> = {
            DPS_approved: 'Yes' // Add DPS_approved requirement
          };
          
          requiredParams.forEach(param => {
            const value = searchParams.get(param);
            if (value) paramObject[param] = value;
          });
          
          // Add the question type if it exists
          const q_type = searchParams.get('q_type');
          if (q_type) paramObject.q_type = q_type;
          
          // Add amount parameter
          const amount = searchParams.get('amount');
          if (amount) paramObject.amount = amount;
          
          // Add user's question tracking data if available
          if (user && user.question_tracking) {
            paramObject.trackedQuestions = JSON.stringify(user.question_tracking);
            paramObject.userId = user._id as string;
          }
          
          console.log('Sending query parameters:', paramObject);

          const response = await fetch('/api/questions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(paramObject),
          });

          if (!response.ok) {
            throw new Error('Failed to fetch questions');
          }

          const data = await response.json();
          setQuestions(data);
          setPdfQuestionSet(null);
        }
      } catch (error) {
        console.error('Failed to fetch questions:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch questions');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [router, searchParams, user]);

  if (loading) {
    return <div>Loading questions...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (pdfQuestionSet) {
    return <PDFQuestionDisplay pdfSet={pdfQuestionSet} />;
  }

  if (questions.length === 0) {
    return <div>No questions found</div>;
  }

  // Allow PDF generation for non-student users
  const canGeneratePdf = user ? user.type !== 'student' : false;

  return (
    <QuestionDisplay 
      questions={questions} 
      questionSetLabel={questionSetLabel}
      canGeneratePdf={canGeneratePdf}
    />
  );
}
