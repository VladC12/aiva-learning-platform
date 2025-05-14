import { Question } from '@/models/Question';
import styles from './QuestionModal.module.css';
import MarkdownMathRenderer from './MarkdownMathRenderer';
import PDFViewer from './PDFViewer';
import { useState } from 'react';

interface QuestionModalProps {
    question: Question;
    isOpen: boolean;
    onClose: () => void;
}

const QuestionModal: React.FC<QuestionModalProps> = ({ question, isOpen, onClose }) => {
    const [showSolution, setShowSolution] = useState<boolean>(false);
    
    if (!isOpen || !question) return null;
    
    // Check if this is a PDF question set
    const isPdfQuestionSet = !!question.question_pdf_blob;
    
    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={`${styles.modal} ${isPdfQuestionSet ? styles.pdfModal : ''}`} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3>{isPdfQuestionSet ? 'PDF Exam Set' : 'Question Details'}</h3>
                    <button onClick={onClose} className={styles.closeButton}>×</button>
                </div>
                <div className={styles.modalContent}>
                    {isPdfQuestionSet ? (
                        <>
                            <div className={styles.questionInfo}>
                                <div><strong>Title:</strong> {question.label}</div>
                            </div>
                            <div className={styles.pdfControls}>
                                <button 
                                    className={`${styles.pdfToggleButton} ${!showSolution ? styles.active : ''}`}
                                    onClick={() => setShowSolution(false)}
                                >
                                    Questions
                                </button>
                                <button 
                                    className={`${styles.pdfToggleButton} ${showSolution ? styles.active : ''}`}
                                    onClick={() => setShowSolution(true)}
                                >
                                    Solutions
                                </button>
                            </div>
                            <div className={styles.pdfContainer}>
                                <PDFViewer 
                                    file={showSolution ? question.solution_pdf_blob! : question.question_pdf_blob!}
                                    scaleDefault={1.2}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className={styles.questionInfo}>
                                <div><strong>Subject:</strong> {question.subject}</div>
                                <div><strong>Topic:</strong> {question.topic}</div>
                                <div><strong>Difficulty:</strong> {question.difficulty_level}</div>
                            </div>
                            <div className={styles.questionSolutionGrid}>
                                <div className={styles.questionColumn}>
                                    <div className={styles.contentBox}>
                                        {question.question ?
                                            <MarkdownMathRenderer content={question.question} /> :
                                            <div>No question available</div>
                                        }
                                    </div>
                                </div>
                                <div className={styles.solutionColumn}>
                                    <div className={styles.contentBox}>
                                        {question.solution ?
                                            <MarkdownMathRenderer content={question.solution} /> :
                                            <div>No solution available</div>
                                        }
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuestionModal;