import React, { useState, useEffect } from 'react';
import styles from './QuestionList.module.css';
import { useRouter } from 'next/navigation';
import { QuestionSet as QuestionSetType } from '@/models/QuestionSet';

interface QuestionSetProps {
  set: QuestionSetType;
  onClick: () => void;
}

const QuestionSet: React.FC<QuestionSetProps> = ({ set, onClick }) => {
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
    <div className={styles.questionSet} onClick={onClick}>
      <div className={`${styles.initialsBox} ${isPdfSet ? styles.pdfSet : ''}`}>
        <span className={styles.initials}>{initials}</span>
      </div>
      <span className={styles.label}>{set.label}</span>
    </div>
  );
};

const QuestionList: React.FC = () => {
  const [questionSets, setQuestionSets] = useState<QuestionSetType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    // Fetch question sets from your API
    const fetchQuestionSets = async () => {
      try {
        const response = await fetch('/api/question-sets');
        const data = await response.json();
        setQuestionSets(data);
      } catch (error) {
        console.error('Error fetching question sets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestionSets();
  }, []);

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

  if (loading) {
    return <div className={styles.loading}>Loading question sets...</div>;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Question Sets</h2>
      <div className={styles.listContainer}>
        {questionSets.length > 0 ? (
          questionSets.map((set) => (
            <QuestionSet
              key={set._id.toString()}
              set={set}
              onClick={() => handleQuestionSetClick(set)}
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