import { useState, useEffect } from 'react';
import { Question } from '../../../models/Question';
import styles from './QuestionSetBuilder.module.css';

interface QuestionSetBuilderProps {
  selectedQuestions: Question[];
  onClose: () => void;
  onSuccess: () => void;
}

type BuilderMode = 'dps' | 'freeform';

export default function QuestionSetBuilder({ 
  selectedQuestions, 
  onClose,
  onSuccess
}: QuestionSetBuilderProps) {
  const [setLabel, setSetLabel] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [builderMode, setBuilderMode] = useState<BuilderMode>('dps');
  const [freeformQuestions, setFreeformQuestions] = useState<Question[]>([]);
  
  // Questions organized by section and type
  const [organizedQuestions, setOrganizedQuestions] = useState<{
    A: { MCQ: Question[], AR: Question[] },
    B: { VSA: Question[] },
    C: { SA: Question[] },
    D: { LA: Question[] },
    E: { CaseStudy: Question[] }
  }>({
    A: { MCQ: [], AR: [] },
    B: { VSA: [] },
    C: { SA: [] },
    D: { LA: [] },
    E: { CaseStudy: [] }
  });

  // Validation function to check if we have enough questions of each type
  const validateQuestionSet = () => {
    const { A, B, C, D, E } = organizedQuestions;
    
    if (A.MCQ.length < 18) {
      return `Need ${18 - A.MCQ.length} more MCQ questions for Section A`;
    }
    
    if (A.AR.length < 2) {
      return `Need ${2 - A.AR.length} more A-R questions for Section A`;
    }
    
    if (B.VSA.length < 5) {
      return `Need ${5 - B.VSA.length} more VSA questions for Section B`;
    }
    
    if (C.SA.length < 6) {
      return `Need ${6 - C.SA.length} more SA questions for Section C`;
    }
    
    if (D.LA.length < 4) {
      return `Need ${4 - D.LA.length} more LA questions for Section D`;
    }
    
    if (E.CaseStudy.length < 3) {
      return `Need ${3 - E.CaseStudy.length} more Case-Study questions for Section E`;
    }
    
    return '';
  };

  useEffect(() => {
    if (builderMode === 'freeform') {
      setFreeformQuestions([...selectedQuestions]);
    } else {
      const sorted = {
        A: { MCQ: [] as Question[], AR: [] as Question[] },
        B: { VSA: [] as Question[] },
        C: { SA: [] as Question[] },
        D: { LA: [] as Question[] },
        E: { CaseStudy: [] as Question[] }
      };
      
      selectedQuestions.forEach(question => {
        const qType = question.q_type || '';
        
        if (qType === 'MCQ' && sorted.A.MCQ.length < 18) {
          sorted.A.MCQ.push(question);
        } else if (qType === 'A-R' && sorted.A.AR.length < 2) {
          sorted.A.AR.push(question);
        } else if (qType === 'VSA' && sorted.B.VSA.length < 5) {
          sorted.B.VSA.push(question);
        } else if (qType === 'SA' && sorted.C.SA.length < 6) {
          sorted.C.SA.push(question);
        } else if (qType === 'LA' && sorted.D.LA.length < 4) {
          sorted.D.LA.push(question);
        } else if (qType === 'Case-Study' && sorted.E.CaseStudy.length < 3) {
          sorted.E.CaseStudy.push(question);
        }
      });
      
      setOrganizedQuestions(sorted);
    }
  }, [selectedQuestions, builderMode]);

  const handleSaveQuestionSet = async () => {
    if (!setLabel.trim()) {
      setErrorMessage('Please provide a label for the question set');
      return;
    }
    
    // For DPS mode, validate the question set structure
    if (builderMode === 'dps') {
      const validationError = validateQuestionSet();
      if (validationError) {
        setErrorMessage(validationError);
        return;
      }
    } else if (freeformQuestions.length === 0) {
      setErrorMessage('Please select at least one question for your question set');
      return;
    }
    
    setIsSaving(true);
    setErrorMessage('');
    
    try {
      // Get the appropriate questions based on mode
      let questionIds: string[];
      
      if (builderMode === 'dps') {
        // Flatten the organized questions back to a single array in the correct order
        const orderedQuestions: Question[] = [
          ...organizedQuestions.A.MCQ,
          ...organizedQuestions.A.AR,
          ...organizedQuestions.B.VSA,
          ...organizedQuestions.C.SA,
          ...organizedQuestions.D.LA,
          ...organizedQuestions.E.CaseStudy
        ];
        questionIds = orderedQuestions.map(q => q._id.toString());
      } else {
        // Use the freeform questions
        questionIds = freeformQuestions.map(q => q._id.toString());
      }
      
      const response = await fetch('/api/question-sets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          label: setLabel,
          questions: questionIds,
          format: builderMode
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save question set');
      }
      
      setSuccessMessage('Question set saved successfully!');
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error) {
      console.error('Error saving question set:', error);
      setErrorMessage('Failed to save question set. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Create Question Set</h2>
        <button className={styles.closeButton} onClick={onClose}>×</button>
      </div>
      
      <div className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="setLabel">Question Set Label:</label>
          <input
            id="setLabel"
            type="text"
            value={setLabel}
            onChange={(e) => setSetLabel(e.target.value)}
            placeholder="Enter a label for this question set"
            className={styles.input}
          />
        </div>
        
        <div className={styles.formGroup}>
          <label>Question Set Format:</label>
          <div className={styles.formatSelector}>
            <button 
              className={`${styles.formatButton} ${builderMode === 'dps' ? styles.active : ''}`}
              onClick={() => setBuilderMode('dps')}
              type="button"
            >
              DPS Format
            </button>
            <button 
              className={`${styles.formatButton} ${builderMode === 'freeform' ? styles.active : ''}`}
              onClick={() => setBuilderMode('freeform')}
              type="button"
            >
              Freeform
            </button>
          </div>
        </div>
        
        <div className={styles.sectionsContainer}>
          {builderMode === 'dps' ? (
            <>
              <h3>Selected Questions by Section</h3>
              
              <div className={styles.section}>
                <h4>Section A</h4>
                <div className={styles.questionTypeGroup}>
                  <h5>MCQ Questions (1-18): {organizedQuestions.A.MCQ.length}/18</h5>
                  <ul className={styles.questionList}>
                    {organizedQuestions.A.MCQ.map((q, index) => (
                      <li key={q._id.toString()} className={styles.questionItem}>
                        <span className={styles.questionNumber}>{index + 1}</span>
                        <span className={styles.questionTopic}>{q.topic}</span>
                        <span className={styles.questionDifficulty}>{q.difficulty_level}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={styles.questionTypeGroup}>
                  <h5>A-R Questions (19-20): {organizedQuestions.A.AR.length}/2</h5>
                  <ul className={styles.questionList}>
                    {organizedQuestions.A.AR.map((q, index) => (
                      <li key={q._id.toString()} className={styles.questionItem}>
                        <span className={styles.questionNumber}>{19 + index}</span>
                        <span className={styles.questionTopic}>{q.topic}</span>
                        <span className={styles.questionDifficulty}>{q.difficulty_level}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className={styles.section}>
                <h4>Section B</h4>
                <div className={styles.questionTypeGroup}>
                  <h5>VSA Questions (21-25): {organizedQuestions.B.VSA.length}/5</h5>
                  <ul className={styles.questionList}>
                    {organizedQuestions.B.VSA.map((q, index) => (
                      <li key={q._id.toString()} className={styles.questionItem}>
                        <span className={styles.questionNumber}>{21 + index}</span>
                        <span className={styles.questionTopic}>{q.topic}</span>
                        <span className={styles.questionDifficulty}>{q.difficulty_level}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className={styles.section}>
                <h4>Section C</h4>
                <div className={styles.questionTypeGroup}>
                  <h5>SA Questions (26-31): {organizedQuestions.C.SA.length}/6</h5>
                  <ul className={styles.questionList}>
                    {organizedQuestions.C.SA.map((q, index) => (
                      <li key={q._id.toString()} className={styles.questionItem}>
                        <span className={styles.questionNumber}>{26 + index}</span>
                        <span className={styles.questionTopic}>{q.topic}</span>
                        <span className={styles.questionDifficulty}>{q.difficulty_level}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className={styles.section}>
                <h4>Section D</h4>
                <div className={styles.questionTypeGroup}>
                  <h5>LA Questions (32-35): {organizedQuestions.D.LA.length}/4</h5>
                  <ul className={styles.questionList}>
                    {organizedQuestions.D.LA.map((q, index) => (
                      <li key={q._id.toString()} className={styles.questionItem}>
                        <span className={styles.questionNumber}>{32 + index}</span>
                        <span className={styles.questionTopic}>{q.topic}</span>
                        <span className={styles.questionDifficulty}>{q.difficulty_level}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className={styles.section}>
                <h4>Section E</h4>
                <div className={styles.questionTypeGroup}>
                  <h5>Case-Study Questions (36-38): {organizedQuestions.E.CaseStudy.length}/3</h5>
                  <ul className={styles.questionList}>
                    {organizedQuestions.E.CaseStudy.map((q, index) => (
                      <li key={q._id.toString()} className={styles.questionItem}>
                        <span className={styles.questionNumber}>{36 + index}</span>
                        <span className={styles.questionTopic}>{q.topic}</span>
                        <span className={styles.questionDifficulty}>{q.difficulty_level}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <>
              <h3>Selected Questions ({freeformQuestions.length})</h3>
              <div className={styles.section}>
                <div className={styles.questionTypeGroup}>
                  <ul className={styles.questionList} style={{ maxHeight: '500px' }}>
                    {freeformQuestions.map((q, index) => (
                      <li key={q._id.toString()} className={styles.questionItem}>
                        <span className={styles.questionNumber}>{index + 1}</span>
                        <span className={styles.questionTopic}>{q.topic}</span>
                        <span className={styles.questionType}>{q.q_type || 'N/A'}</span>
                        <span className={styles.questionDifficulty}>{q.difficulty_level}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
        
        {errorMessage && (
          <div className={styles.errorMessage}>{errorMessage}</div>
        )}
        
        {successMessage && (
          <div className={styles.successMessage}>{successMessage}</div>
        )}
        
        <div className={styles.actions}>
          <button 
            className={styles.cancelButton} 
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button 
            className={styles.saveButton} 
            onClick={handleSaveQuestionSet}
            disabled={isSaving || !setLabel.trim() || (builderMode === 'dps' && !!validateQuestionSet()) || (builderMode === 'freeform' && freeformQuestions.length === 0)}
          >
            {isSaving ? 'Saving...' : 'Save Question Set'}
          </button>
        </div>
      </div>
    </div>
  );
}