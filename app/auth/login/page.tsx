'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import Button from 'app/components/Button';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email_address: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      console.log('Login API good');
      
      // Get the response data
      const data = await response.json();
      
      // Check if response was successful
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      console.log('Login response good');
      console.log('Token good');
      
      try {
        // Set token as httpOnly cookie
        await fetch('/api/auth/set-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: data.token }),
        });
        console.log('Set token good');
        
        // Update analytics based on user role
        if (data.user && data.user.role) {
          await fetch('/api/analytics/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ role: data.user.role }),
          });
          console.log('Analytics updated');
        }
        
        // Simply use window.location for the most reliable navigation
        window.location.href = '/';
      } catch (cookieError) {
        setError('Failed to set authentication. Please try again.');
        console.error('Cookie setting error:', cookieError);
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Login</h1>
        <div className={styles.links}>
          <span>
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className={styles.toggleLink}>
              Sign Up
            </Link>
          </span>
          <Link href="/auth/recover" className={styles.toggleLink}>
            Forgot Password?
          </Link>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="email_address">Email Address</label>
          <input
            type="email"
            id="email_address"
            name="email_address"
            value={formData.email_address}
            onChange={handleChange}
            required
            autoComplete="email"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            autoComplete="current-password"
          />
        </div>

        <Button type="submit" variant="large" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className={styles.spinner}></span>
              Logging in...
            </>
          ) : (
            'Login'
          )}
        </Button>
      </form>
    </div>
  );
}