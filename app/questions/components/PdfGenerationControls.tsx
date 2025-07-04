import React, { useState } from 'react';
import { Question } from '@/models/Question';
import styles from './PdfGenerationControls.module.css';

interface PdfGenerationControlsProps {
  questions: Question[];
  questionSetLabel?: string;
}

const PdfGenerationControls: React.FC<PdfGenerationControlsProps> = ({ 
  questions, 
  questionSetLabel = 'Question Set' 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePdf = async (includeSolutions: boolean) => {
    try {
      setIsGenerating(true);
      
      // Import HTML PDF generator
      const { generateQuestionPDF } = await import('@/lib/htmlPdfGenerator');
      
      const title = `${questionSetLabel} ${includeSolutions ? '(with Solutions)' : '(Questions Only)'}`;
      await generateQuestionPDF(questions, title, includeSolutions);

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