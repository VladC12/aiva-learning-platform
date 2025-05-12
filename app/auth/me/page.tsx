'use client';

import { useUser } from 'context/UserContext';
import styles from './page.module.css';
import Link from 'next/link';
import StudentProfile from 'app/components/StudentProfile';
import TeacherProfile from 'app/components/TeacherProfile';

export default function ProfilePage() {
  const { user, loading } = useUser();

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