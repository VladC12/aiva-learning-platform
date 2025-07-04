import { Question } from '../../../models/Question';
import styles from './QuestionSetBuilder.module.css';

interface BuilderQuestionItemProps {
  question: Question;
  index: number;
  displayNumber: number;
  selectedQuestions: Question[];
  onViewQuestion?: (question: Question) => void;
  showType?: boolean;
  onDeselectQuestion: (questionId: string) => void;
}

export default function BuilderQuestionItem({
  question,
  displayNumber,
  onViewQuestion,
  showType = false,
  onDeselectQuestion
}: BuilderQuestionItemProps) {
  return (
    <li key={question._id.toString()} className={styles.questionItem}>
      <span className={styles.questionNumber}>{displayNumber}</span>
      <span className={styles.questionId}>Q-{question.q_number || 'N/A'}</span>
      {showType && (
        <span className={styles.questionType}>{question.q_type || 'N/A'}</span>
      )}
      <div className={styles.questionActions}>
        {onViewQuestion && (
          <button 
            className={styles.viewButton}
            onClick={() => onViewQuestion(question)}
          >
            View
          </button>
        )}
        <button 
          className={styles.deselectButton}
          onClick={(e) => {
            e.stopPropagation(); // Prevent event bubbling
            onDeselectQuestion(question._id.toString());
          }}
          title="Remove question"
        >
          &times;
        </button>
      </div>
    </li>
  );
}