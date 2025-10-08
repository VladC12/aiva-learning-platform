import { useState } from 'react';
import { Question, FilterOption } from '../../../models/Question';
import { updateQuestion } from '../../../lib/questionApi';
import StatusToggle from '../../components/StatusToggle';
import styles from './QuestionItem.module.css';

interface QuestionItemProps {
  question: Question;
  filterOptions: Record<string, FilterOption>;
  isModerator: boolean;
  isReviewer: boolean;
  isReadOnly?: boolean;
  isSelectable?: boolean;
  isSelected?: boolean;
  isAtLimit?: boolean;
  onQuestionUpdate: (updatedQuestion: Question) => void;
  onViewQuestion: (question: Question) => void;
  onSelectQuestion?: (question: Question) => void;
}

export default function QuestionItem({
  question,
  filterOptions,
  isModerator,
  isReviewer,
  isReadOnly = false,
  isSelectable = false,
  isSelected = false,
  isAtLimit = false,
  onQuestionUpdate,
  onViewQuestion,
  onSelectQuestion
}: QuestionItemProps) {
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteText, setNoteText] = useState(question.reviewer_note || '');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const handleChangeDifficulty = async (newDifficulty: string) => {
    if (isReadOnly) return;

    try {
      const field = isModerator ? 'modDifficulty_level' : 'difficulty_level';
      await updateQuestion(question._id, { [field]: newDifficulty });
      onQuestionUpdate({ ...question, [field]: newDifficulty });
    } catch (error) {
      console.error('Error updating question difficulty:', error);
    }
  };

  const handleToggleInCourse = async (newValue: boolean) => {
    if (isReadOnly) return;

    try {
      const field = isModerator ? 'modInCourse' : 'inCourse';
      await updateQuestion(question._id, { [field]: newValue });
      onQuestionUpdate({ ...question, [field]: newValue });
    } catch (error) {
      console.error('Error updating in course status:', error);
    }
  };

  const handleToggleHOTS = async (newValue: boolean) => {
    if (isReadOnly) return;

    try {
      const field = isModerator ? 'modIsHOTS' : 'isHOTS';
      await updateQuestion(question._id, { [field]: newValue });
      onQuestionUpdate({ ...question, [field]: newValue });
    } catch (error) {
      console.error('Error updating HOTS status:', error);
    }
  };

  const handleToggleCorrect = async (newValue: boolean) => {
    if (isReadOnly) return;

    try {
      const field = isModerator ? 'modIsCorrect' : 'isCorrect';
      await updateQuestion(question._id, { [field]: newValue });
      onQuestionUpdate({ ...question, [field]: newValue });
    } catch (error) {
      console.error('Error updating correctness status:', error);
    }
  };

  const handleToggleApproved = async (newValue: boolean) => {
    if (isReadOnly) return;

    try {
      // Update the DPS_approved field directly as it seems to be a standard field, not one with moderator variants
      await updateQuestion(question._id, { DPS_approved: newValue });
      onQuestionUpdate({ ...question, DPS_approved: newValue });
    } catch (error) {
      console.error('Error updating approval status:', error);
    }
  };

  const handleChangeQuestionType = async (newType: string) => {
    if (isReadOnly) return;

    try {
      const field = isModerator ? 'modQ_type' : 'q_type';
      await updateQuestion(question._id, { [field]: newType });
      onQuestionUpdate({ ...question, [field]: newType });
    } catch (error) {
      console.error('Error updating question type:', error);
    }
  };

  const handleSaveNote = async () => {
    if (!isReviewer) return;

    try {
      setIsSavingNote(true);
      const trimmedNote = noteText.trim();

      // If the note is empty, set it to null or undefined to remove it
      const updateValue = trimmedNote === '' ? null : trimmedNote;

      await updateQuestion(question._id, { reviewer_note: updateValue });
      onQuestionUpdate({ ...question, reviewer_note: trimmedNote || undefined });
      setIsNoteModalOpen(false);
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note. Please try again.');
    } finally {
      setIsSavingNote(false);
    }
  };

  // Get the current difficulty value based on moderator status
  const currentDifficulty = isModerator
    ? (question.modDifficulty_level !== undefined ? question.modDifficulty_level : question.difficulty_level)
    : question.difficulty_level;

  // Get the current question type based on moderator status
  const currentQuestionType = isModerator
    ? (question.modQ_type !== undefined ? question.modQ_type : question.q_type || '')
    : (question.q_type || '');

  return (
    <div className={`${isReadOnly ? styles.questionItemReadOnly : styles.questionItem} ${isSelected ? styles.selected : ''}`}>
      {isSelectable && (
        <div className={styles.questionSelect}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelectQuestion && onSelectQuestion(question)}
            disabled={isAtLimit && !isSelected}
            title={isAtLimit && !isSelected ? "Maximum number of questions of this type already selected" : ""}
            className={isAtLimit && !isSelected ? styles.disabledCheckbox : ''}
          />
        </div>
      )}
      <div className={styles.questionNumber}>
        {question.q_number !== undefined ? question.q_number : '-'}
      </div>
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
        {isReadOnly ? (
          <span>{currentDifficulty}</span>
        ) : (
          <select
            value={currentDifficulty}
            onChange={(e) => handleChangeDifficulty(e.target.value)}
            className={styles.difficultySelect}
          >
            {filterOptions.difficulty_level?.content.map((level: string) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        )}
      </div>
      <div className={styles.questionClass}>{question.class}</div>
      {!isReadOnly &&
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
            readOnly={isReadOnly}
          />
        </div>}
      {!isReadOnly &&
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
            readOnly={isReadOnly}
          />
        </div>}
      {!isReadOnly &&
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
            readOnly={isReadOnly}
          />
        </div>}
      {!isReadOnly &&
        <div className={styles.questionApproved}>
          <StatusToggle
            value={question.DPS_approved}
            onToggle={handleToggleApproved}
            trueLabel="Yes"
            falseLabel="No"
            unmarkedLabel="Unmarked"
            trueBtnLabel="✓"
            falseBtnLabel="✕"
            readOnly={isReadOnly}
          />
        </div>}
      <div className={styles.questionType}>
        {isReadOnly ? (
          <span>{currentQuestionType || 'Not specified'}</span>
        ) : (
          <select
            value={currentQuestionType}
            onChange={(e) => handleChangeQuestionType(e.target.value)}
            className={styles.typeSelect}
          >
            <option value="">Select Type</option>
            {filterOptions.q_type?.content.map((type: string) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        )}
      </div>

      {isReviewer && (
        <div className={styles.questionNotes}>
          <button
            className={styles.noteButton}
            onClick={() => setIsNoteModalOpen(true)}
          >
            {question.reviewer_note ? 'Edit Note' : 'Add Note'}
          </button>
        </div>
      )}

      {isReviewer && isNoteModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.noteModal}>
            <h3>Reviewer Note</h3>
            <textarea
              className={styles.noteTextarea}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Enter your notes about this question..."
              rows={6}
            />
            <div className={styles.noteModalActions}>
              <button
                className={styles.cancelButton}
                onClick={() => setIsNoteModalOpen(false)}
                disabled={isSavingNote}
              >
                Cancel
              </button>
              <button
                className={styles.saveButton}
                onClick={handleSaveNote}
                disabled={isSavingNote}
              >
                {isSavingNote ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}