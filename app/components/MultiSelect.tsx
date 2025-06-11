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
  const selectRef = useRef<HTMLDivElement>(null);
  const [displayCount, setDisplayCount] = useState(2);

  // Calculate how many items can fit in the available space
  useEffect(() => {
    const calculateDisplayCount = () => {
      if (!selectRef.current) return;
      
      const containerWidth = selectRef.current.clientWidth - 40; // Subtract padding and arrow space
      const avgCharWidth = 8; // Average character width in pixels (approx)
      const separator = ', ';
      
      if (value.length <= 1) return setDisplayCount(1);
      
      // Calculate total characters if we were to display all
      let totalChars = 0;
      let maxItems = 0;
      
      for (let i = 0; i < value.length; i++) {
        const itemLength = value[i].length;
        // Add separator length except for the first item
        const newTotal = totalChars + itemLength + (i > 0 ? separator.length : 0);
        
        if (newTotal * avgCharWidth <= containerWidth) {
          totalChars = newTotal;
          maxItems = i + 1;
        } else {
          break;
        }
      }
      
      setDisplayCount(Math.max(1, maxItems));
    };

    calculateDisplayCount();
    
    // Recalculate when window is resized
    window.addEventListener('resize', calculateDisplayCount);
    return () => window.removeEventListener('resize', calculateDisplayCount);
  }, [value, selectRef]);

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

  const toggleAll = () => {
    if (value.length === options.length) {
      // If all are selected, deselect all
      onChange([]);
    } else {
      // Otherwise, select all
      onChange([...options]);
    }
  };

  // Function to format selected values display
  const getDisplayText = () => {
    if (value.length === 0) return '';
    if (value.length === options.length) return 'All selected';
    
    if (value.length <= displayCount) {
      return value.join(', ');
    }
    
    return `${value.slice(0, displayCount).join(', ')} +${value.length - displayCount} more`;
  };

  return (
    <div className={styles.container} ref={containerRef} data-open={isOpen}>
      <div className={styles.select} ref={selectRef} onClick={() => setIsOpen(!isOpen)}>
        {value.length > 0 ? (
          <span className={styles.selectedText}>
            {getDisplayText()}
          </span>
        ) : (
          <span className={styles.placeholder}>{placeholder || 'Select options'}</span>
        )}
        <span className={`${styles.arrow} ${isOpen ? styles.up : ''}`}>▼</span>
      </div>
      {isOpen && (
        <div className={styles.dropdown}>
          <div
            className={`${styles.option} ${styles.selectAll}`}
            onClick={toggleAll}
          >
            <input
              type="checkbox"
              checked={value.length === options.length}
              readOnly
            />
            <span>Select All</span>
          </div>
          {options.map(option => (
            <div
              key={option}
              className={`${styles.option} ${value.includes(option) ? styles.selected : ''}`}
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
