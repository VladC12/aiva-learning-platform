import React, { useState, useEffect } from 'react';
import styles from './QuestionList.module.css';
import { useRouter } from 'next/navigation';
import { QuestionSet as QuestionSetType } from '@/models/QuestionSet';
import { useUser } from 'context/UserContext';

interface QuestionSetProps {
  set: QuestionSetType;
  onClick: () => void;
  onDelete?: () => void;
  isTeacher?: boolean;
}

const QuestionSet: React.FC<QuestionSetProps> = ({ set, onClick, onDelete, isTeacher }) => {
  // Extract initials (max 2) from the label
  const initials = set.label
    .split(' ')
    .map(word => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  // Check if this is a PDF question set
  const isPdfSet = set.question_pdf_blob !== undefined;

  return (
    <div className={styles.questionSet}>
      <div className={`${styles.initialsBox} ${isPdfSet ? styles.pdfSet : ''}`} onClick={onClick}>
        <span className={styles.initials}>{initials}</span>
      </div>
      <span className={styles.label} onClick={onClick}>{set.label}</span>

      {isTeacher && onDelete && (
        <button
          className={styles.deleteButton}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Remove question set from room"
        >
          ×
        </button>
      )}
    </div>
  );
};

interface QuestionListProps {
  roomId?: string;
  filterByRoom?: boolean;
  title?: string;
}

const QuestionList: React.FC<QuestionListProps> = ({
  roomId,
  filterByRoom = false,
  title = "Question Sets"
}) => {
  const [questionSets, setQuestionSets] = useState<QuestionSetType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useUser();
  const isTeacher = user?.type === 'teacher';

  useEffect(() => {
    // Fetch question sets from your API
    const fetchQuestionSets = async () => {
      try {
        setLoading(true);
        let url = '/api/question-sets';

        // Add room filter if needed
        if (filterByRoom && roomId) {
          url = `/api/question-sets?roomId=${roomId}`;
        } else if (filterByRoom === false && title.includes("Global")) {
          // Fetch only global question sets (not assigned to any room)
          url = `/api/question-sets?globalOnly=true`;
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch question sets');
        }

        const data = await response.json();
        setQuestionSets(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching question sets:', error);
        setError('Failed to load question sets. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestionSets();
  }, [filterByRoom, roomId, title]);

  const handleQuestionSetClick = (set: QuestionSetType) => {
    // Create URL params from question IDs
    const params = new URLSearchParams();
    params.append('q', set._id.toString());

    // If it's a PDF set, add a flag
    if (set.question_pdf_blob) {
      params.append('type', 'pdf');
    }

    // Navigate to questions page with the IDs as query parameters
    router.push(`/questions?${params.toString()}`);
  };

  const handleDeleteQuestionSet = async (setId: string) => {
    if (!roomId || !isTeacher) return;

    if (!confirm("Are you sure you want to remove this question set from your room?")) {
      return;
    }

    try {
      // First, remove the question set from the room
      const response = await fetch(`/api/rooms/${roomId}/question-sets/${setId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove question set from room');
      }
      
      const deleteResponse = await fetch(`/api/question-set/${setId}`, {
        method: 'DELETE',
      });

      if (!deleteResponse.ok) {
        throw new Error('Failed to delete question set from database');
      }


      // Update the UI by removing the deleted question set
      setQuestionSets(prevSets => prevSets.filter(set => set._id.toString() !== setId));
    } catch (error) {
      console.error('Error removing question set:', error);
      alert(`Failed to remove question set: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading question sets...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.listContainer}>
        {questionSets.length > 0 ? (
          questionSets.map((set) => (
            <QuestionSet
              key={set._id.toString()}
              set={set}
              onClick={() => handleQuestionSetClick(set)}
              onDelete={filterByRoom && isTeacher ? () => handleDeleteQuestionSet(set._id.toString()) : undefined}
              isTeacher={isTeacher && filterByRoom}
            />
          ))
        ) : (
          <p className={styles.emptyMessage}>No question sets found.</p>
        )}
      </div>
    </div>
  );
};

export default QuestionList;