"use client";
import { useState } from 'react';
import { useUser } from 'context/UserContext';
import Button from 'app/components/Button';
import PDFViewer from 'app/components/PDFViewer';
import styles from '../page.module.css';

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

export default PDFQuestionDisplay;