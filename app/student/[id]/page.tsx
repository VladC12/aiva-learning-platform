'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from 'context/UserContext';
import styles from './page.module.css';
import StudentProfile from 'app/components/StudentProfile';
import Link from 'next/link';
import { UserData } from 'context/UserContext';

export default function StudentDetailPage() {
  const { user, loading } = useUser();
  const [studentData, setStudentData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;

  useEffect(() => {
    // Check if the user is logged in and is a teacher
    if (!loading && (!user || user.type !== 'teacher')) {
      router.push('/auth/login?redirect=/student/' + studentId);
      return;
    }

    // Only fetch student data if we have a logged-in teacher
    if (!loading && user?.type === 'teacher' && studentId) {
      fetchStudentData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, studentId, router]);

  const fetchStudentData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/student/${studentId}`);
      
      if (!response.ok) {
        // If unauthorized, redirect to login
        if (response.status === 401) {
          router.push('/auth/login?redirect=/student/' + studentId);
          return;
        }
        
        // For other error statuses, try to extract the error message
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          // It's JSON, so parse it
          const errorData = await response.json();
          throw new Error(errorData.message || `Error: ${response.status}`);
        } else {
          // Not JSON, treat as text
          const errorText = await response.text();
          throw new Error(errorText || `Error: ${response.status}`);
        }
      }

      const data = await response.json();
      setStudentData(data.student);
    } catch (error: unknown) {
      console.error('Error fetching student data:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while fetching student data');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (loading || isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading student data...</div>
      </div>
    );
  }

  // If not a teacher, show unauthorized message
  if (!user || user.type !== 'teacher') {
    return (
      <div className={styles.container}>
        <div className={styles.unauthorized}>
          <h2>Access Denied</h2>
          <p>You must be a teacher to view student details.</p>
          <Link href="/auth/login" className={styles.loginButton}>
            Log In as Teacher
          </Link>
        </div>
      </div>
    );
  }

  // If there's an error loading student data
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorMessage}>
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={fetchStudentData} className={styles.retryButton}>
            Retry
          </button>
          <Link href="/auth/me" className={styles.backButton}>
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // If no student data found
  if (!studentData) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h2>Student Not Found</h2>
          <p>The requested student could not be found or you don&apos;t have permission to view their data.</p>
          <Link href="/auth/me" className={styles.backButton}>
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Render the student profile with the fetched data
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/auth/me" className={styles.backLink}>
          ← Back to Teacher Dashboard
        </Link>
        <h1>Student Profile: {studentData.first_name} {studentData.last_name}</h1>
      </div>
      
      <StudentProfile user={studentData} />
    </div>
  );
}