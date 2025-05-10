import styles from './StudentProfile.module.css'
import Link from 'next/link';
import { Question, TrackedQuestion } from '@/models/Question';
import { UserData } from 'context/UserContext';
import { useEffect, useState } from 'react';

interface Props {
    user: UserData;
}

const StudentProfile: React.FC<Props> = ({ user }) => {
    const [trackedQuestions, setTrackedQuestions] = useState<Record<string, TrackedQuestion>>({});
    const [loadingQuestions, setLoadingQuestions] = useState<boolean>(true);

    useEffect(() => {
        // Only fetch question details if the user has question tracking data
        if (!user || !user._id || !user.question_tracking) {
            setLoadingQuestions(false);
            return;
        }

        const fetchQuestionDetails = async () => {
            try {
                setLoadingQuestions(true);
                const questionIds = Object.keys(user.question_tracking || {});

                if (questionIds.length === 0) {
                    setLoadingQuestions(false);
                    return;
                }

                // Fetch question details for all tracked questions
                const response = await fetch(`/api/questions/batch?ids=${questionIds.join(',')}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch question details');
                }

                const questionsData = await response.json();

                // Combine question details with tracking data
                const trackedWithDetails: Record<string, TrackedQuestion> = {};

                questionIds.forEach(id => {
                    const tracking = user.question_tracking?.[id];
                    if (tracking) {
                        trackedWithDetails[id] = {
                            question: questionsData.questions.find((q: Question) => q._id.toString() === id) || null,
                            status: tracking.status,
                            timestamp: tracking.timestamp,
                            attempts: tracking.attempts || 1
                        };
                    }
                });

                setTrackedQuestions(trackedWithDetails);
            } catch (error) {
                console.error('Error fetching question details:', error);
            } finally {
                setLoadingQuestions(false);
            }
        };

        fetchQuestionDetails();
    }, [user]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>My Profile</h1>
            </div>

            <div className={styles.profileGrid}>
                <div className={styles.infoCard}>
                    <h2>Personal Information</h2>
                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Username:</span>
                        <span className={styles.infoValue}>{user.username}</span>
                    </div>
                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Email:</span>
                        <span className={styles.infoValue}>{user.email_address}</span>
                    </div>
                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Name:</span>
                        <span className={styles.infoValue}>{user.first_name} {user.middle_name ? `${user.middle_name} ` : ''}{user.last_name}</span>
                    </div>
                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Education Board:</span>
                        <span className={styles.infoValue}>{user.education_board}</span>
                    </div>
                    {user.country_of_residence && (
                        <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>Country:</span>
                            <span className={styles.infoValue}>{user.country_of_residence}</span>
                        </div>
                    )}
                </div>

                <div className={styles.statsCard}>
                    <h2>Learning Progress</h2>
                    <div className={styles.statsGrid}>
                        <div className={styles.statItem}>
                            <div className={styles.statValue}>
                                {Object.keys(user.question_tracking || {}).length}
                            </div>
                            <div className={styles.statLabel}>Questions Attempted</div>
                        </div>
                        <div className={styles.statItem}>
                            <div className={styles.statValue}>
                                {Object.values(user.question_tracking || {}).filter(q => q.status === 'success').length}
                            </div>
                            <div className={styles.statLabel}>Successful</div>
                        </div>
                        <div className={styles.statItem}>
                            <div className={styles.statValue}>
                                {Object.values(user.question_tracking || {}).filter(q => q.status === 'unsure').length}
                            </div>
                            <div className={styles.statLabel}>Unsure</div>
                        </div>
                        <div className={styles.statItem}>
                            <div className={styles.statValue}>
                                {Object.values(user.question_tracking || {}).filter(q => q.status === 'failed').length}
                            </div>
                            <div className={styles.statLabel}>Need Practice</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.questionHistory}>
                <h2>Question History</h2>
                {loadingQuestions ? (
                    <div className={styles.loading}>Loading question history...</div>
                ) : Object.keys(trackedQuestions).length > 0 ? (
                    <div className={styles.questionList}>
                        <div className={styles.questionHeader}>
                            <div className={styles.questionSubject}>Subject</div>
                            <div className={styles.questionTitle}>Question</div>
                            <div className={styles.questionStatus}>Status</div>
                            <div className={styles.questionAttempts}>Attempts</div>
                            <div className={styles.questionDate}>Last Attempted</div>
                        </div>
                        {Object.entries(trackedQuestions)
                            .sort((a, b) => b[1].timestamp - a[1].timestamp) // Sort by most recent
                            .map(([id, data]) => (
                                <div key={id} className={styles.questionItem}>
                                    <div className={styles.questionSubject}>
                                        {data.question?.subject || 'Unknown'}
                                    </div>
                                    <div className={styles.questionTitle}>
                                        <Link href={`/questions?id=${id}`} className={styles.questionLink}>
                                            {data.question?.question.substring(0, 100) || 'Question not found'}
                                            {(data.question?.question.length || 0) > 100 && '...'}
                                        </Link>
                                    </div>
                                    <div className={`${styles.questionStatus} ${styles[`status${data.status}`]}`}>
                                        {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
                                    </div>
                                    <div className={styles.questionAttempts}>
                                        {data.attempts}
                                    </div>
                                    <div className={styles.questionDate}>
                                        {new Date(data.timestamp).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <p>You haven&apos;t attempted any questions yet.</p>
                        <Link href="/questions" className={styles.exploreButton}>
                            Explore Questions
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default StudentProfile