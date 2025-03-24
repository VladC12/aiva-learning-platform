'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import Button from 'app/components/Button';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email_address: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      console.log('Login API good')
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      console.log('Login response good')
      const { token } = await response.json();
      console.log('Token good')
      // Set token as httpOnly cookie
      await fetch('/api/auth/set-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });
      console.log('Set token good')
      router.push('/');
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred');
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
            Don't have an account?{' '}
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
          />
        </div>

        <Button type="submit" variant="large">
          Login
        </Button>
      </form>
    </div>
  );
}