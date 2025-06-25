import styles from './QuestionCountDisplay.module.css';

interface QuestionCountDisplayProps {
  total: number;
  limit: number;
  onLimitChange: (limit: number) => void;
}

export default function QuestionCountDisplay({
  total,
  limit,
  onLimitChange
}: QuestionCountDisplayProps) {
  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onLimitChange(parseInt(e.target.value, 10));
  };

  return (
    <div className={styles.questionControls}>
      <div className={styles.questionCount}>
        {total} Questions Found
      </div>
      <div className={styles.limitSelector}>
        <label htmlFor="limit">Show:</label>
        <select
          id="limit"
          value={limit.toString()}
          onChange={handleLimitChange}
        >
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
        </select>
      </div>
    </div>
  );
}