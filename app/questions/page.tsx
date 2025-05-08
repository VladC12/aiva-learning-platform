"use client";
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '../components/Button';
import styles from './page.module.css';
import { Question } from '@/models/Question';
import MarkdownMathRenderer from 'app/components/MarkdownMathRenderer';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for required URL parameters
    const requiredParams = ['education_board', 'class', 'subject', 'topic', 'difficulty_level'];
    const missingParams = requiredParams.filter(param => !searchParams.has(param));
    console.log(searchParams);
    
    if (missingParams.length > 0 && searchParams.get('q') === null) {
      // Redirect to home page or a selection page if parameters are missing
      router.push('/');
      return;
    }

    const fetchQuestions = async () => {
      try {
        // Check if we're loading a question set
        const questionSetId = searchParams.get('q');
        
        if (questionSetId) {
          // Handle question set loading
          const response = await fetch('/api/question-set', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              q: questionSetId
            }),
          });
    
          if (!response.ok) {
            throw new Error('Failed to fetch question set');
          }
    
          const data = await response.json();
          setQuestions(data);
        } else {
          // Build parameters object from search params for regular filtering
          const paramObject: Record<string, string> = {};
          requiredParams.forEach(param => {
            const value = searchParams.get(param);
            if (value) paramObject[param] = value;
          });
    
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
        }
      } catch (error) {
        console.error('Failed to fetch questions:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch questions');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [router, searchParams]);

  if (loading) {
    return <div>Loading questions...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (questions.length === 0) {
    return <div>No questions found</div>;
  }

  return <QuestionDisplay questions={questions} />;
}

// Component that shows the actual questions and UI
function QuestionDisplay({ questions }: { questions: Question[] }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const currentQuestion = questions[currentQuestionIndex];

  const getDifficultyClass = (difficulty: string) => {
    const firstWord = difficulty.split(' ')[0].toLowerCase();
    return `difficulty-${firstWord}`;
  };

  const handlePrev = () => {
    setCurrentQuestionIndex((prev: number) => Math.max(0, prev - 1));
    setShowSolution(false);
  };

  const handleNext = () => {
    setCurrentQuestionIndex((prev: number) => Math.min(questions.length - 1, prev + 1));
    setShowSolution(false);
  };

  const handleMarkQuestion = (_status: string) => {
    // TODO: Implement question status tracking
    handleNext();
  };

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <div className={styles.questionCount}>
          Question: {`${currentQuestionIndex + 1} / ${questions.length}`}
        </div>
        <div className={styles.information}>
          <div><strong>Education Board:</strong> {currentQuestion.education_board}</div>
          <div><strong>Class:</strong> {currentQuestion.class}</div>
          <div><strong>Topic:</strong> {currentQuestion.topic}</div>
          <div><strong>Subject:</strong> {currentQuestion.subject}</div>
          <div><strong>Difficulty:</strong> <span className={`${styles.difficulty} ${styles[getDifficultyClass(currentQuestion.difficulty_level)]}`}>
            {currentQuestion.difficulty_level}
          </span></div>
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.questionArea}>
          <div className={styles.questionContent}>
            <br />
            <MarkdownMathRenderer content={currentQuestion.question} />
          </div>

          {showSolution && (
            <div className={styles.solution}>
              <MarkdownMathRenderer content={currentQuestion.solution} />
              <div className={styles.markButtons}>
                <Button variant="failed" onClick={() => handleMarkQuestion('failed')}>Failed</Button>
                <Button variant="unsure" onClick={() => handleMarkQuestion('unsure')}>Unsure</Button>
                <Button variant="success" onClick={() => handleMarkQuestion('success')}>Success</Button>
              </div>
            </div>
          )}
        </div>

        <div className={styles.navigation}>
          <div className={styles.buttonGroup}>
            <Button onClick={handlePrev} disabled={currentQuestionIndex === 0}>Prev</Button>
            <Button onClick={() => setShowSolution(!showSolution)}>
              {showSolution ? "Hide Solution" : "Show Solution"}
            </Button>
            <Button onClick={handleNext} disabled={currentQuestionIndex === questions.length - 1}>Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
