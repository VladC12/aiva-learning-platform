import React, { useState, useEffect } from 'react';
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
  const { user, refreshUser } = useUser();
  const [pdfLimit, setPdfLimit] = useState<number | null>(null);

  useEffect(() => {
    if (user && user.pdf_limit_count !== undefined) {
      setPdfLimit(user.pdf_limit_count);
    } else {
      setPdfLimit(null);
    }
  }, [user]);

  const handleGeneratePdf = async (includeSolutions: boolean) => {
    try {
      // Check if user has PDF limit and if they've reached it
      if (pdfLimit !== null && pdfLimit <= 0) {
        alert('You have reached your PDF generation limit in the demo. Please contact AiVA at: contact@aiva.vision if you think this is a mistake!');
        return;
      }

      setIsGenerating(true);

      // Import HTML PDF generator
      const { generateQuestionPDF } = await import('@/lib/htmlPdfGenerator');

      const title = `${questionSetLabel} ${includeSolutions ? '(with Solutions)' : '(Questions Only)'}`;
      await generateQuestionPDF(questions, title, includeSolutions);

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
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Download as PDF</h3>
      <div className={styles.buttonGroup}>
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
    </div>
  );
};

export default PdfGenerationControls;