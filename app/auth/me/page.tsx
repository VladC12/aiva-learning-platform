'use client';

import { useUser } from 'context/UserContext';
import styles from './page.module.css';
import Link from 'next/link';
import StudentProfile from 'app/components/StudentProfile';
import TeacherProfile from 'app/components/TeacherProfile';
import { useEffect } from 'react';

export default function ProfilePage() {
  const { user, loading, refreshUser } = useUser();

  // Refresh user data when the profile page is visited
  useEffect(() => {
    // Always refresh user data when the profile page mounts
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <div className={styles.loading}>Loading profile...</div>;
  }

  if (!user) {
    return (
      <div className={styles.notAuthenticated}>
        <h2>Not Authenticated</h2>
        <p>Please log in to view your profile.</p>
        <Link href="/auth/login" className={styles.loginButton}>Log In</Link>
      </div>
    );
  }

  return user.type === "student" ?
    <StudentProfile user={user} /> :
    <TeacherProfile user={user} />
}