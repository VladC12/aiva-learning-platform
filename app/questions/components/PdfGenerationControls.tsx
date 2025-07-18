import React, { useState, useEffect, useRef } from 'react';
import { Question } from '@/models/Question';
import styles from './PdfGenerationControls.module.css';
import { useUser } from 'context/UserContext';

interface PdfGenerationControlsProps {
  questions: Question[];
  questionSetLabel?: string;
}

const PdfGenerationControls: React.FC<PdfGenerationControlsProps> = ({
  questions,
  questionSetLabel = 'Question Set'
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState<string | null>(null);
  const { user, refreshUser } = useUser();
  const [pdfLimit, setPdfLimit] = useState<number | null>(null);
  const isReviewer = user && user.role !== 'student';
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (user && user.pdf_limit_count !== undefined) {
      setPdfLimit(user.pdf_limit_count);
    } else {
      setPdfLimit(null);
    }
  }, [user]);

  const handleGeneratePdf = async (includeSolutions: boolean, includeReview: boolean = false) => {
    try {
      // Check if user has PDF limit and if they've reached it
      if (pdfLimit !== null && pdfLimit <= 0) {
        alert('You have reached your PDF generation limit in the demo. Please contact AiVA at: contact@aiva.vision if you think this is a mistake!');
        return;
      }

      setIsGenerating(true);
      setGenerationProgress(0);
      setEstimatedTime(null);
      startTimeRef.current = Date.now();

      // Start ETA calculation
      const etaIntervalId = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (elapsedSeconds > 50) {
          // Only show ETA after 50 seconds have passed
          const estimatedTotal = questions.length * (includeSolutions ? 1.5 : 1) * (includeReview ? 1.5 : 1) * 2; // Rough estimate
          const remainingSeconds = Math.max(0, Math.round(estimatedTotal - elapsedSeconds));
          
          if (remainingSeconds > 0) {
            let etaText = '';
            if (remainingSeconds > 60) {
              const minutes = Math.floor(remainingSeconds / 60);
              const seconds = remainingSeconds % 60;
              etaText = `${minutes} min ${seconds} sec`;
            } else {
              etaText = `${remainingSeconds} seconds`;
            }
            setEstimatedTime(etaText);
          }
        }
      }, 1000);

      try {
        // Import HTML PDF generator
        const { generateQuestionPDF } = await import('@/lib/htmlPdfGenerator');

        let titleSuffix = '';
        if (includeSolutions) titleSuffix += ' (with Solutions)';
        if (includeReview) titleSuffix += ' (with Review Form)';
        
        const title = `${questionSetLabel}${titleSuffix}`;
        
        await generateQuestionPDF(
          questions, 
          title, 
          includeSolutions, 
          includeReview,
          (progress) => {
            setGenerationProgress(progress);
          }
        );

        // Decrement PDF limit if applicable
        if (pdfLimit !== null) {
          // Call API to decrement the limit in the database
          const response = await fetch('/api/user/decrement-pdf-limit', {
            method: 'POST',
          });

          if (response.ok) {
            const newLimit = pdfLimit - 1;
            setPdfLimit(newLimit);

            // Show remaining limit message
            if (newLimit > 0) {
              alert(`You have ${newLimit} PDF generation${newLimit !== 1 ? 's' : ''} remaining in the demo. Please contact AiVA at: contact@aiva.vision if you think this is a mistake!`);
            } else {
              alert('You have used all your PDF generations in the demo. Please contact AiVA at: contact@aiva.vision if you think this is a mistake!');
            }

            // Refresh user data to update the limit in context
            await refreshUser();
          }
        }
      } catch (error) {
        console.error('Error generating PDF:', error);
        alert(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
      } finally {
        clearInterval(etaIntervalId);
      }
    } catch (error) {
      console.error('Error in PDF generation process:', error);
      alert('An error occurred while preparing to generate the PDF. Please try again.');
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
      setEstimatedTime(null);
    }
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Download as PDF</h3>
      <div className={styles.buttonGroup}>
        <div className={styles.standardButtons}>
          <button
            className={`${styles.button} ${styles.questionsButton}`}
            onClick={() => handleGeneratePdf(false)}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Questions Only'}
          </button>
          <button
            className={`${styles.button} ${styles.solutionsButton}`}
            onClick={() => handleGeneratePdf(true)}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'With Solutions'}
          </button>
        </div>
        
        {isReviewer && (
          <button
            className={`${styles.button} ${styles.reviewButton}`}
            onClick={() => handleGeneratePdf(true, true)}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'With Review Form'}
          </button>
        )}
        
        {isGenerating && (
          <div className={styles.progressContainer}>
            <div className={styles.progressInfo}>
              {estimatedTime ? (
                <span>Estimated time remaining: {estimatedTime}</span>
              ) : (
                <span>Generating PDF, please wait...</span>
              )}
            </div>
            <div className={styles.progressBarContainer}>
              <div 
                className={styles.progressBar} 
                style={{ width: `${Math.max(5, generationProgress)}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfGenerationControls;