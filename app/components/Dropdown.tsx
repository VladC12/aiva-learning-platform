"use client";
import { useState, useRef, useEffect } from 'react';
import styles from './Dropdown.module.css';

interface DropdownProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function Dropdown({ label, value, options, onChange, placeholder }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={styles.container}>
      <label className={styles.label}>{label}</label>
      <div className={styles.selectWrapper}>
        <select
          ref={selectRef}
          className={styles.select}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(false);
            selectRef.current?.blur();
          }}
          // onFocus={() => setIsOpen(true)}
          // onBlur={() => setIsOpen(false)}
          onClick={() => {
            if (isOpen) {
              setIsOpen(false);
              selectRef.current?.blur();
            }
          }}
        >
          <option value="">{placeholder || `Select ${label}`}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className={`${styles.arrow} ${isOpen ? styles.up : ''}`}>▼</span>
      </div>
    </div>
  );
}