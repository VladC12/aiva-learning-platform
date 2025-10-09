import { useState, useEffect } from 'react';
import styles from './NumberInput.module.css';

interface NumberInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}

const NumberInput: React.FC<NumberInputProps> = ({
  label,
  value,
  onChange,
  min = 5,
  max = 60,
  step = 5,
  placeholder = "Enter a value"
}) => {
  const [localValue, setLocalValue] = useState<string>(value);
  
  // Ensure the initial value is valid
  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  
  // Function to normalize any number to valid range and step
  const normalizeValue = (input: string): string => {
    // Parse the input
    const num = parseInt(input, 10);
    
    // Handle NaN case
    if (isNaN(num)) return min.toString();
    
    // Apply min/max constraints
    let normalized = Math.min(Math.max(num, min), max);
    
    // Round to nearest multiple of step
    normalized = Math.round(normalized / step) * step;
    
    return normalized.toString();
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow typing any number, but store it locally only
    setLocalValue(e.target.value);
  };
  
  const handleBlur = () => {
    // When user finishes typing, normalize the value
    const normalized = normalizeValue(localValue);
    setLocalValue(normalized);
    onChange(normalized);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Normalize on Enter key
      const normalized = normalizeValue(localValue);
      setLocalValue(normalized);
      onChange(normalized);
    }
  };
  
  const handleIncrement = () => {
    const currentValue = parseInt(localValue, 10) || 0;
    const nextValue = Math.min(currentValue + step, max);
    setLocalValue(nextValue.toString());
    onChange(nextValue.toString());
  };
  
  const handleDecrement = () => {
    const currentValue = parseInt(localValue, 10) || 0;
    const nextValue = Math.max(currentValue - step, min);
    setLocalValue(nextValue.toString());
    onChange(nextValue.toString());
  };
  
  return (
    <div className={styles.container}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.inputContainer}>
        <button 
          type="button"
          className={styles.button}
          onClick={handleDecrement}
          aria-label="Decrease value"
        >
          -
        </button>
        <input
          type="text"
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={styles.input}
          inputMode="numeric"
          pattern="[0-9]*"
        />
        <button 
          type="button"
          className={styles.button}
          onClick={handleIncrement}
          aria-label="Increase value"
        >
          +
        </button>
      </div>
    </div>
  );
};

export default NumberInput;
