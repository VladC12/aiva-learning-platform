import React, { useState, useEffect } from 'react';
import styles from './StudentProfile.module.css'
import { UserData } from 'context/UserContext';
import QuestionList from './QuestionList';
import QuestionHistory from './QuestionHistory';
import StudentAnalytics from './StudentAnalytics';
import QuestionSetHistory from './QuestionSetHistory';
import { Question } from '@/models/Question';

interface Props {
    user: UserData;
}

const StudentProfile: React.FC<Props> = ({ user }) => {
    const [questionData, setQuestionData] = useState<Record<string, Question>>({});
    const [loadingAnalytics, setLoadingAnalytics] = useState<boolean>(true);

    useEffect(() => {
        // Fetch question data for analytics
        const fetchQuestionData = async () => {
            if (!user?.question_tracking) {
                setLoadingAnalytics(false);
                return;
            }

            try {
                setLoadingAnalytics(true);
                const questionIds = Object.keys(user.question_tracking).filter(
                    id => !user.question_tracking?.[id]?.isPdfQuestionSet
                );
                
                if (questionIds.length === 0) {
                    setLoadingAnalytics(false);
                    return;
                }
                
                // Fetch in batches to avoid URL length limits
                const batchSize = 50;
                const questionMap: Record<string, Question> = {};
                
                for (let i = 0; i < questionIds.length; i += batchSize) {
                    const batchIds = questionIds.slice(i, i + batchSize);
                    const response = await fetch(
                        `/api/questions/batch?ids=${batchIds.join(',')}&page=1&limit=${batchIds.length}`
                    );
                    
                    if (!response.ok) {
                        throw new Error('Failed to fetch question data');
                    }
                    
                    const data = await response.json();
                    
                    // Add to our question map
                    data.questions.forEach((question: Question) => {
                        questionMap[question._id.toString()] = question;
                    });
                }
                
                setQuestionData(questionMap);
            } catch (error) {
                console.error('Error fetching question data for analytics:', error);
            } finally {
                setLoadingAnalytics(false);
            }
        };

        fetchQuestionData();
    }, [user?.question_tracking]);

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

            {/* Question Set Completion History */}
            <QuestionSetHistory user={user} />
            
            {/* Add Question Sets section for students with a room */}
            {user?.room && (
                <div className={styles.roomQuestionSets}>
                    <QuestionList
                        roomId={user.room}
                        filterByRoom={true}
                        title="Class Question Sets"
                    />
                </div>
            )}
            
            {/* Analytics Component */}
            {loadingAnalytics ? (
                <div className={styles.analyticsContainer}>
                    <h2>Performance Analytics</h2>
                    <div className={styles.loading}>Loading analytics data...</div>
                </div>
            ) : (
                <StudentAnalytics user={user} questionData={questionData} />
            )}
            
            <QuestionHistory user={user} />
        </div>
    );
}

export default StudentProfile;