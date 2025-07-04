import { Question } from '../../../models/Question';
import styles from './QuestionSetBuilder.module.css';
import BuilderQuestionItem from './BuilderQuestionItem';

interface QuestionSectionProps {
  title: string;
  questions: Question[];
  startIndex: number;
  maxCount: number;
  selectedQuestions: Question[];
  onViewQuestion?: (question: Question) => void;
  onDeselectQuestion: (questionId: string) => void;
}

export default function QuestionSection({
  title,
  questions,
  startIndex,
  maxCount,
  selectedQuestions,
  onViewQuestion,
  onDeselectQuestion
}: QuestionSectionProps) {
  return (
    <div className={styles.questionTypeGroup}>
      <h5>{title}: {questions.length}/{maxCount}</h5>
      <ul className={styles.questionList}>
        {questions.map((question, index) => (
          <BuilderQuestionItem
            key={question._id.toString()}
            question={question}
            index={index}
            displayNumber={startIndex + index}
            selectedQuestions={selectedQuestions}
            onViewQuestion={onViewQuestion}
            onDeselectQuestion={onDeselectQuestion}
          />
        ))}
      </ul>
    </div>
  );
}