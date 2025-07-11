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
  builderMode?: 'dps' | 'freeform';
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
  builderMode = 'dps',
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
  
  // Calculate current type counts when in selectable mode
  const typeCounts = isSelectable ? {
    'MCQ': selectedQuestions.filter(q => q.q_type === 'MCQ').length,
    'A-R': selectedQuestions.filter(q => q.q_type === 'A-R').length,
    'VSA': selectedQuestions.filter(q => q.q_type === 'VSA').length,
    'SA': selectedQuestions.filter(q => q.q_type === 'SA').length,
    'LA': selectedQuestions.filter(q => q.q_type === 'LA').length,
    'Case-Study': selectedQuestions.filter(q => q.q_type === 'Case-Study').length,
  } : {};
  
  // Define type limits
  const typeLimits = {
    'MCQ': 18,
    'A-R': 2,
    'VSA': 5,
    'SA': 6,
    'LA': 4,
    'Case-Study': 3
  };
  
  return (
    <div className={styles.questionList}>
      <div className={styles.questionHeader}>
        {isSelectable && <div className={styles.questionSelect}></div>}
        <div className={styles.questionNumber}>Nr</div>
        <div className={styles.questionTopic}>Topic</div>
        <div className={styles.questionContent}>Question</div>
        <div className={styles.questionDifficulty}>Difficulty</div>
        <div className={styles.questionClass}>Class</div>
        {!isReadOnly && <div className={styles.questionInCourse}>In Course</div>}
        <div className={styles.questionHOTS}>HOTS</div>
        {!isReadOnly && <div className={styles.questionCorrect}>Correct</div>}
        <div className={styles.questionType}>Type</div>
        {isReviewer && <div className={styles.questionNotes}>Notes</div>}
      </div>

      {questions.map((question) => {
        // In freeform mode, only limit is the total of 20 questions
        // In DPS mode, limits are per question type
        let isAtLimit = false;
        
        if (isSelectable) {
          if (builderMode === 'dps') {
            // DPS mode: Check type-specific limits
            const qType = question.q_type || '';
            isAtLimit = (typeCounts[qType as keyof typeof typeCounts] || 0) >= 
                        (typeLimits[qType as keyof typeof typeLimits] || 0) &&
                        !selectedQuestions.some(q => q._id === question._id);
          } else {
            // Freeform mode: Only check total limit of 20
            isAtLimit = selectedQuestions.length >= 20 && 
                        !selectedQuestions.some(q => q._id === question._id);
          }
        }
        
        return (
          <QuestionItem
            key={question._id as string}
            question={question}
            filterOptions={filterOptions}
            isModerator={isModerator}
            isReviewer={isReviewer}
            isReadOnly={isReadOnly}
            isSelectable={isSelectable}
            isSelected={selectedQuestions.some(q => q._id === question._id)}
            isAtLimit={isAtLimit}
            onQuestionUpdate={onQuestionUpdate}
            onViewQuestion={onViewQuestion}
            onSelectQuestion={onToggleSelectQuestion}
          />
        );
      })}
    </div>
  );
}