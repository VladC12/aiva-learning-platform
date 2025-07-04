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
  // Calculate if a question can be selected based on current selection
  const canSelectQuestion = (question: Question): boolean => {
    if (!isSelectable || !onToggleSelectQuestion) return false;
    if (selectedQuestions.some(q => q._id === question._id)) return true;
    
    const qType = question.q_type || '';
    
    // Count how many questions of each type we already have
    const counts = selectedQuestions.reduce((acc, q) => {
      const type = q.q_type || '';
      if (!acc[type]) acc[type] = 0;
      acc[type]++;
      return acc;
    }, {} as Record<string, number>);
    
    // Check limits for each question type
    if (qType === 'MCQ' && (counts['MCQ'] || 0) >= 18) return false;
    if (qType === 'A-R' && (counts['A-R'] || 0) >= 2) return false;
    if (qType === 'VSA' && (counts['VSA'] || 0) >= 5) return false;
    if (qType === 'SA' && (counts['SA'] || 0) >= 6) return false;
    if (qType === 'LA' && (counts['LA'] || 0) >= 4) return false;
    if (qType === 'Case-Study' && (counts['Case-Study'] || 0) >= 3) return false;
    
    return true;
  };

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
        <div className={styles.questionNumber}>Nr</div>
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
          isSelectable={isSelectable && canSelectQuestion(question)}
          isSelected={selectedQuestions.some(q => q._id === question._id)}
          onQuestionUpdate={onQuestionUpdate}
          onViewQuestion={onViewQuestion}
          onSelectQuestion={onToggleSelectQuestion}
        />
      ))}
    </div>
  );
}