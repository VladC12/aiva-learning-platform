import { useState, useRef, useEffect } from 'react';
import styles from './MultiSelect.module.css';

interface MultiSelectProps {
  options: string[];
  value: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

export default function MultiSelect({ options, value, onChange, placeholder }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    const newValue = value.includes(option)
      ? value.filter(item => item !== option)
      : [...value, option];
    onChange(newValue);
  };

  return (
    <div className={styles.container} ref={containerRef} data-open={isOpen}>
      <div className={styles.select} onClick={() => setIsOpen(!isOpen)}>
        {value.length > 0 ? (
          <span className={styles.selectedText}>
            {value.length === options.length 
              ? 'All selected' 
              : `${value.length} selected`}
          </span>
        ) : (
          <span className={styles.placeholder}>{placeholder || 'Select options'}</span>
        )}
        <span className={`${styles.arrow} ${isOpen ? styles.up : ''}`}>▼</span>
      </div>
      {isOpen && (
        <div className={styles.dropdown}>
          {options.map(option => (
            <div
              key={option}
              className={styles.option}
              onClick={() => toggleOption(option)}
            >
              <input
                type="checkbox"
                checked={value.includes(option)}
                readOnly
              />
              <span>{option}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
