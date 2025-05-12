import { Question } from '@/models/Question';
import styles from './QuestionModal.module.css';
import MarkdownMathRenderer from './MarkdownMathRenderer';

interface QuestionModalProps {
    question: Question;
    isOpen: boolean;
    onClose: () => void;
}

const QuestionModal: React.FC<QuestionModalProps> = ({ question, isOpen, onClose }) => {
    if (!isOpen || !question) return null;
    
    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3>Question Details</h3>
                    <button onClick={onClose} className={styles.closeButton}>×</button>
                </div>
                <div className={styles.modalContent}>
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
                </div>
            </div>
        </div>
    );
};

export default QuestionModal;