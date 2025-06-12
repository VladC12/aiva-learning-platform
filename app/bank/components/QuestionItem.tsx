import { Question, FilterOption } from '../../../models/Question';
import { updateQuestion } from '../../../lib/questionApi';
import StatusToggle from '../../components/StatusToggle';
import styles from './QuestionItem.module.css';

interface QuestionItemProps {
  question: Question;
  filterOptions: Record<string, FilterOption>;
  isModerator: boolean;
  onQuestionUpdate: (updatedQuestion: Question) => void;
  onViewQuestion: (question: Question) => void;
}

export default function QuestionItem({
  question,
  filterOptions,
  isModerator,
  onQuestionUpdate,
  onViewQuestion
}: QuestionItemProps) {
  const handleChangeDifficulty = async (newDifficulty: string) => {
    try {
      const field = isModerator ? 'modDifficulty_level' : 'difficulty_level';
      await updateQuestion(question._id, { [field]: newDifficulty });
      onQuestionUpdate({ ...question, [field]: newDifficulty });
    } catch (error) {
      console.error('Error updating question difficulty:', error);
    }
  };

  const handleToggleInCourse = async (newValue: boolean) => {
    try {
      const field = isModerator ? 'modInCourse' : 'inCourse';
      await updateQuestion(question._id, { [field]: newValue });
      onQuestionUpdate({ ...question, [field]: newValue });
    } catch (error) {
      console.error('Error updating in course status:', error);
    }
  };

  const handleToggleHOTS = async (newValue: boolean) => {
    try {
      const field = isModerator ? 'modIsHOTS' : 'isHOTS';
      await updateQuestion(question._id, { [field]: newValue });
      onQuestionUpdate({ ...question, [field]: newValue });
    } catch (error) {
      console.error('Error updating HOTS status:', error);
    }
  };

  const handleToggleCorrect = async (newValue: boolean) => {
    try {
      const field = isModerator ? 'modIsCorrect' : 'isCorrect';
      await updateQuestion(question._id, { [field]: newValue });
      onQuestionUpdate({ ...question, [field]: newValue });
    } catch (error) {
      console.error('Error updating correctness status:', error);
    }
  };

  const handleChangeQuestionType = async (newType: string) => {
    try {
      const field = isModerator ? 'modQ_type' : 'q_type';
      await updateQuestion(question._id, { [field]: newType });
      onQuestionUpdate({ ...question, [field]: newType });
    } catch (error) {
      console.error('Error updating question type:', error);
    }
  };

  return (
    <div className={styles.questionItem}>
      <div className={styles.questionTopic}>{question.topic}</div>
      <div className={styles.questionContent}>
        <button
          className={styles.viewQuestionButton}
          onClick={() => onViewQuestion(question)}
        >
          View Question
        </button>
      </div>
      <div className={styles.questionDifficulty}>
        <select
          value={isModerator 
            ? (question.modDifficulty_level !== undefined ? question.modDifficulty_level : question.difficulty_level)
            : question.difficulty_level
          }
          onChange={(e) => handleChangeDifficulty(e.target.value)}
          className={styles.difficultySelect}
        >
          {filterOptions.difficulty_level?.content.map((level: string) => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>
      </div>
      <div className={styles.questionClass}>{question.class}</div>
      <div className={styles.questionInCourse}>
        <StatusToggle
          value={isModerator
            ? (question.modInCourse !== undefined ? question.modInCourse : question.inCourse)
            : question.inCourse
          }
          onToggle={handleToggleInCourse}
          trueLabel="Yes"
          falseLabel="No"
          unmarkedLabel="Unmarked"
          trueBtnLabel="✓"
          falseBtnLabel="✕"
        />
      </div>
      <div className={styles.questionHOTS}>
        <StatusToggle
          value={isModerator
            ? (question.modIsHOTS !== undefined ? question.modIsHOTS : question.isHOTS)
            : question.isHOTS
          }
          onToggle={handleToggleHOTS}
          trueLabel="Yes"
          falseLabel="No"
          unmarkedLabel="Unmarked"
          trueBtnLabel="✓"
          falseBtnLabel="✕"
        />
      </div>
      <div className={styles.questionCorrect}>
        <StatusToggle
          value={isModerator
            ? (question.modIsCorrect !== undefined ? question.modIsCorrect : question.isCorrect)
            : question.isCorrect
          }
          onToggle={handleToggleCorrect}
          trueLabel="Yes"
          falseLabel="No"
          unmarkedLabel="Unmarked"
          trueBtnLabel="✓"
          falseBtnLabel="✕"
        />
      </div>
      <div className={styles.questionType}>
        <select
          value={isModerator
            ? (question.modQ_type !== undefined ? question.modQ_type : question.q_type || '')
            : (question.q_type || '')
          }
          onChange={(e) => handleChangeQuestionType(e.target.value)}
          className={styles.typeSelect}
        >
          <option value="">Select Type</option>
          {filterOptions.q_type?.content.map((type: string) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>
    </div>
  );
}