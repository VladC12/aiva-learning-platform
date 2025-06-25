import { Question, FilterOption } from '../../../models/Question';
import QuestionItem from './QuestionItem';
import styles from './QuestionList.module.css';

interface QuestionListProps {
  questions: Question[];
  filterOptions: Record<string, FilterOption>;
  isModerator: boolean;
  isReviewer: boolean;
  isReadOnly?: boolean;
  isSelectable?: boolean;
  selectedQuestions?: Question[];
  onQuestionUpdate: (updatedQuestion: Question) => void;
  onViewQuestion: (question: Question) => void;
  onToggleSelectQuestion?: (question: Question) => void;
}

export default function QuestionList({
  questions,
  filterOptions,
  isModerator,
  isReviewer,
  isReadOnly = false,
  isSelectable = false,
  selectedQuestions = [],
  onQuestionUpdate,
  onViewQuestion,
  onToggleSelectQuestion
}: QuestionListProps) {
  if (questions.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No questions found matching the current filters.</p>
        <p>Try adjusting your filter criteria.</p>
      </div>
    );
  }
  
  return (
    <div className={styles.questionList}>
      <div className={styles.questionHeader}>
        {isSelectable && <div className={styles.questionSelect}></div>}
        <div className={styles.questionTopic}>Topic</div>
        <div className={styles.questionContent}>Question</div>
        <div className={styles.questionDifficulty}>Difficulty</div>
        <div className={styles.questionClass}>Class</div>
        <div className={styles.questionInCourse}>In Course</div>
        <div className={styles.questionHOTS}>HOTS</div>
        <div className={styles.questionCorrect}>Correct</div>
        <div className={styles.questionType}>Type</div>
        {isReviewer && <div className={styles.questionNotes}>Notes</div>}
      </div>

      {questions.map((question) => (
        <QuestionItem
          key={question._id as string}
          question={question}
          filterOptions={filterOptions}
          isModerator={isModerator}
          isReviewer={isReviewer}
          isReadOnly={isReadOnly}
          isSelectable={isSelectable}
          isSelected={selectedQuestions.some(q => q._id === question._id)}
          onQuestionUpdate={onQuestionUpdate}
          onViewQuestion={onViewQuestion}
          onSelectQuestion={onToggleSelectQuestion}
        />
      ))}
    </div>
  );
}