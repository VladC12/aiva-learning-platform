"use client";
import { useState, useEffect } from 'react';
import Button from '../components/Button';
import styles from './page.module.css';
import { Question } from '@/models/Question';
import MarkdownMathRenderer from 'app/components/MarkdownMathRenderer';

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        // First try to fetch from protected endpoint
        let response = await fetch(`${window.location.origin}/api/questions`);

        // If unauthorized, fetch from demo endpoint
        if (response.status === 401) {
          setIsDemo(true);
          response = await fetch(`${window.location.origin}/api/demo-questions`);
        }

        if (!response.ok) {
          throw new Error('Failed to fetch questions');
        }

        const data = await response.json();
        setQuestions(data);
      } catch (error) {
        console.error('Failed to fetch questions:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch questions');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  if (loading) {
    return <div>Loading questions...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (questions.length === 0) {
    return <div>No questions found</div>;
  }

  return (
    <div className={styles.questionsWrapper}>
      {isDemo && (
        <div className={styles.demoHeader}>
          <h2>Demo Mode - Limited to 5 Questions</h2>
          <Button onClick={() => window.location.href = '/auth/signup'} variant='large'>
            Sign Up for Full Access
          </Button>
        </div>
      )}
      <QuestionsContent questions={questions} />
    </div>
  );

  
  function QuestionsContent({ questions }: { questions: Question[] }) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [showSolution, setShowSolution] = useState(false);
    const currentQuestion = questions[currentQuestionIndex];
    
    const getDifficultyClass = (difficulty: string) => {
      const firstWord = difficulty.split(' ')[0].toLowerCase();
      console.log(`difficulty-${firstWord} vs ${difficulty}`)
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

    const handleMarkQuestion = (status: string) => {
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
              <MarkdownMathRenderer content={currentQuestion.question}/>
            </div>

            {showSolution && (
              <div className={styles.solution}>
                <MarkdownMathRenderer content={currentQuestion.solution}/>
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
}
