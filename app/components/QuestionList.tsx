import React from 'react';
import styles from './QuestionList.module.css';

interface QuestionSetProps {
  label: string;
}

const QuestionSet: React.FC<QuestionSetProps> = ({ label }) => {
  // Extract initials (max 2) from the label
  const initials = label
    .split(' ')
    .map(word => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className={styles.questionSet}>
      <div className={styles.initialsBox}>
        <span className={styles.initials}>{initials}</span>
      </div>
      <span className={styles.label}>{label}</span>
    </div>
  );
};

const QuestionList: React.FC = () => {
  // Mock data for question sets
  const questionSets = [
    { id: 1, label: "2025 Exam" },
    { id: 2, label: "Math Simulation" },
    { id: 3, label: "Biology Quiz" },
    { id: 4, label: "History Review" },
    { id: 5, label: "Physics Practice" },
  ];

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Question Sets</h2>
      <div className={styles.listContainer}>
        {questionSets.map((set) => (
          <QuestionSet key={set.id} label={set.label} />
        ))}
      </div>
    </div>
  );
};

export default QuestionList;