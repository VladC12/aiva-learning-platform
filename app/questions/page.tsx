"use client";
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '../components/Button';
import styles from './page.module.css';
import { Question } from '@/models/Question';
import MarkdownMathRenderer from 'app/components/MarkdownMathRenderer';
import { useUser } from 'context/UserContext';
import PDFViewer from 'app/components/PDFViewer';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

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
          setPdfQuestionSet(null);
        } else {
          // Build parameters object from search params for regular filtering
          const paramObject: Record<string, string> = {};
          requiredParams.forEach(param => {
            const value = searchParams.get(param);
            if (value) paramObject[param] = value;
          });
          
          // Add the question type if it exists
          const q_type = searchParams.get('q_type');
          if (q_type) paramObject.q_type = q_type;
          
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
  }, [router, searchParams]);

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

  return <QuestionDisplay questions={questions} />;
}

// PDF Question set display component
function PDFQuestionDisplay({ pdfSet }: {
  pdfSet: {
    _id: string;
    question_pdf_blob: string;
    solution_pdf_blob: string;
    label: string;
  }
}) {
  const [showSolution, setShowSolution] = useState(false);
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMarkQuestion = async (status: 'success' | 'failed' | 'unsure') => {
    if (!user || !pdfSet._id) {
      console.error("User not logged in or question set ID missing");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/track-student-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId: pdfSet._id.toString(),
          status,
          isPdfQuestionSet: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to track question status');
      }

      // Stay on the same page but show a success indicator
      // We could add a toast notification here
      alert(`Marked as ${status}`);
    } catch (error) {
      console.error('Error tracking question:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <div className={styles.questionCount}>
          PDF Exam
        </div>
        <div className={styles.information}>
          <div><strong>Title:</strong> {pdfSet.label}</div>
          <div><strong>Question Set ID:</strong> {pdfSet._id}</div>
          {/* Placeholder for missing information */}
          <div><strong>Education Board:</strong> Not specified</div>
          <div><strong>Subject:</strong> Not specified</div>
          <div><strong>Difficulty:</strong> <span className={styles.difficulty}>
            Not specified
          </span></div>
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.questionArea}>
          <div className={styles.questionContent}>
            <h2>{showSolution ? "Solution" : "Questions"}</h2>
            <PDFViewer
              file={pdfSet.question_pdf_blob}
              scaleDefault={1.2}
            />
          </div>

          {showSolution && (
            <div className={styles.solution}>
              <PDFViewer
                file={pdfSet.solution_pdf_blob}
                scaleDefault={1.2}
              />
              <div className={styles.markButtons}>
                <Button
                  variant="failed"
                  onClick={() => handleMarkQuestion('failed')}
                  disabled={isSubmitting}
                >
                  Failed
                </Button>
                <Button
                  variant="unsure"
                  onClick={() => handleMarkQuestion('unsure')}
                  disabled={isSubmitting}
                >
                  Unsure
                </Button>
                <Button
                  variant="success"
                  onClick={() => handleMarkQuestion('success')}
                  disabled={isSubmitting}
                >
                  Success
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className={styles.navigation}>
          <div className={styles.buttonGroup}>
            <Button onClick={() => setShowSolution(!showSolution)}>
              {showSolution ? "Show Questions" : "Show Solutions"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Regular Question display component
function QuestionDisplay({ questions }: { questions: Question[] }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentQuestion = questions[currentQuestionIndex];
  const { user } = useUser();

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

  const handleMarkQuestion = async (status: 'success' | 'failed' | 'unsure') => {
    if (!user || !currentQuestion._id) {
      console.error("User not logged in or question ID missing");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/track-student-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId: currentQuestion._id.toString(),
          status,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to track question status');
      }

      // Move to next question after tracking
      handleNext();
    } catch (error) {
      console.error('Error tracking question:', error);
    } finally {
      setIsSubmitting(false);
    }
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
                <Button
                  variant="failed"
                  onClick={() => handleMarkQuestion('failed')}
                  disabled={isSubmitting}
                >
                  Failed
                </Button>
                <Button
                  variant="unsure"
                  onClick={() => handleMarkQuestion('unsure')}
                  disabled={isSubmitting}
                >
                  Unsure
                </Button>
                <Button
                  variant="success"
                  onClick={() => handleMarkQuestion('success')}
                  disabled={isSubmitting}
                >
                  Success
                </Button>
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
