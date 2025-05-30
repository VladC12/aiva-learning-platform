'use client';

import React from 'react';
import styles from './StatusToggle.module.css';

interface StatusToggleProps {
  value?: boolean;
  onToggle: (newValue: boolean) => void;
  trueLabel?: string;
  falseLabel?: string;
  unmarkedLabel?: string;
  trueBtnLabel?: string;
  falseBtnLabel?: string;
  className?: string;
}

const StatusToggle: React.FC<StatusToggleProps> = ({
  value,
  onToggle,
  trueLabel = 'Yes',
  falseLabel = 'No',
  unmarkedLabel = 'Unmarked',
  trueBtnLabel = '✓',
  falseBtnLabel = '✕',
  className = '',
}) => {
  // Determine status class based on value
  const statusClass = value !== undefined
    ? value
      ? 'yes'
      : 'no'
    : 'unmarked';

  // Determine label based on value
  const label = value !== undefined
    ? value
      ? trueLabel
      : falseLabel
    : unmarkedLabel;

  return (
    <div className={`${styles.statusToggle} ${styles[statusClass]} ${className}`}>
      <span className={styles.statusLabel}>
        {label}
      </span>
      <div className={styles.toggleButtons}>
        <button 
          className={`${styles.toggleIcon} ${styles.toggleYes} ${value === true ? styles.active : ''}`}
          onClick={() => onToggle(true)}
          title={`Set to ${trueLabel}`}
          type="button"
        >
          {trueBtnLabel}
        </button>
        <button 
          className={`${styles.toggleIcon} ${styles.toggleNo} ${value === false ? styles.active : ''}`}
          onClick={() => onToggle(false)}
          title={`Set to ${falseLabel}`}
          type="button"
        >
          {falseBtnLabel}
        </button>
      </div>
    </div>
  );
};

export default StatusToggle;