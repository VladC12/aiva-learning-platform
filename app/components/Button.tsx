"use client";

import styles from './Button.module.css';

interface ButtonProps {
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'success' | 'failed' | 'unsure' | 'large';
}

export default function Button({ 
  children, 
  type = 'button',
  onClick, 
  disabled = false,
  variant = 'primary'
}: ButtonProps) {
  const variantClass = styles[variant] || styles.primary;

  return (
    <button
      type={type}
      className={`${styles.button} ${variantClass} ${disabled ? styles.disabled : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}