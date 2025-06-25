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
      
      // Dynamically import to avoid including in client bundle if not needed
      const { generateQuestionPDF, downloadPDF } = await import('@/lib/pdfGenerator');
      
      const title = `${questionSetLabel} ${includeSolutions ? '(with Solutions)' : '(Questions Only)'}`;
      const doc = await generateQuestionPDF(questions, title, includeSolutions);
      
      const filename = `${questionSetLabel.replace(/\s+/g, '_')}_${includeSolutions ? 'with_solutions' : 'questions_only'}.pdf`;
      downloadPDF(doc, filename);
      
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