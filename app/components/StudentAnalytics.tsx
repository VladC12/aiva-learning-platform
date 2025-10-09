import React, { useMemo } from 'react';
import { UserData } from 'context/UserContext';
import { Question } from '@/models/Question';
import styles from './StudentProfile.module.css';

interface StudentAnalyticsProps {
    user: UserData;
    questionData: Record<string, Question>;
}

interface TopicStats {
    total: number;
    success: number;
    failed: number;
    unsure: number;
    successRate: number;
}

interface DifficultyStats {
    easy: TopicStats;
    medium: TopicStats;
    hard: TopicStats;
    [key: string]: TopicStats;
}

const StudentAnalytics: React.FC<StudentAnalyticsProps> = ({ user, questionData }) => {
    const analytics = useMemo(() => {
        // Initialize data structures
        const topicStats: Record<string, TopicStats> = {};
        const difficultyStats: DifficultyStats = {
            easy: { total: 0, success: 0, failed: 0, unsure: 0, successRate: 0 },
            medium: { total: 0, success: 0, failed: 0, unsure: 0, successRate: 0 },
            hard: { total: 0, success: 0, failed: 0, unsure: 0, successRate: 0 }
        };
        const questionTypeStats: Record<string, TopicStats> = {};
        
        // Process question tracking data
        if (user.question_tracking) {
            Object.entries(user.question_tracking).forEach(([questionId, tracking]) => {
                const question = questionData[questionId];
                
                // Skip if we don't have question data
                if (!question) return;
                
                // Process topic stats
                const topic = question.topic || 'Unknown';
                if (!topicStats[topic]) {
                    topicStats[topic] = { total: 0, success: 0, failed: 0, unsure: 0, successRate: 0 };
                }
                topicStats[topic].total += 1;
                if (tracking.status === 'success') topicStats[topic].success += 1;
                if (tracking.status === 'failed') topicStats[topic].failed += 1;
                if (tracking.status === 'unsure') topicStats[topic].unsure += 1;
                
                // Process difficulty stats
                const difficulty = question.difficulty_level?.toLowerCase() || 'medium';
                if (!difficultyStats[difficulty]) {
                    difficultyStats[difficulty] = { total: 0, success: 0, failed: 0, unsure: 0, successRate: 0 };
                }
                difficultyStats[difficulty].total += 1;
                if (tracking.status === 'success') difficultyStats[difficulty].success += 1;
                if (tracking.status === 'failed') difficultyStats[difficulty].failed += 1;
                if (tracking.status === 'unsure') difficultyStats[difficulty].unsure += 1;
                
                // Process question type stats (could be multiple-choice, free-response, etc.)
                const questionType = question.q_type || 'Standard';
                if (!questionTypeStats[questionType]) {
                    questionTypeStats[questionType] = { total: 0, success: 0, failed: 0, unsure: 0, successRate: 0 };
                }
                questionTypeStats[questionType].total += 1;
                if (tracking.status === 'success') questionTypeStats[questionType].success += 1;
                if (tracking.status === 'failed') questionTypeStats[questionType].failed += 1;
                if (tracking.status === 'unsure') questionTypeStats[questionType].unsure += 1;
            });
        }
        
        // Calculate success rates
        Object.keys(topicStats).forEach(topic => {
            const stats = topicStats[topic];
            stats.successRate = stats.total > 0 ? (stats.success / stats.total) * 100 : 0;
        });
        
        Object.keys(difficultyStats).forEach(difficulty => {
            const stats = difficultyStats[difficulty];
            stats.successRate = stats.total > 0 ? (stats.success / stats.total) * 100 : 0;
        });
        
        Object.keys(questionTypeStats).forEach(type => {
            const stats = questionTypeStats[type];
            stats.successRate = stats.total > 0 ? (stats.success / stats.total) * 100 : 0;
        });
        
        // Find strengths and weaknesses with improved logic
        const SUCCESS_THRESHOLD = 70; // 70% success rate is considered good
        const LOW_PERFORMANCE_THRESHOLD = 50; // Below 50% needs improvement

        // Filter topics with enough attempts
        const topicsWithEnoughData = Object.entries(topicStats)
            .filter(([_, stats]) => stats.total >= 3); // Only consider topics with enough attempts
            
        // Separate into strengths and weaknesses based on thresholds
        const strengths = topicsWithEnoughData
            .filter(([_, stats]) => stats.successRate >= SUCCESS_THRESHOLD)
            .sort((a, b) => b[1].successRate - a[1].successRate)
            .slice(0, 3)
            .map(([topic]) => topic);
            
        const weaknesses = topicsWithEnoughData
            .filter(([_, stats]) => stats.successRate < LOW_PERFORMANCE_THRESHOLD)
            .sort((a, b) => a[1].successRate - b[1].successRate)
            .slice(0, 3)
            .map(([topic]) => topic);
        
        // If we don't have enough clear weaknesses, include topics that are below average
        if (weaknesses.length < 3) {
            const averageSuccessRate = topicsWithEnoughData.reduce(
                (sum, [_, stats]) => sum + stats.successRate, 
                0
            ) / (topicsWithEnoughData.length || 1);
            
            const additionalWeaknesses = topicsWithEnoughData
                .filter(([topic, stats]) => 
                    stats.successRate < averageSuccessRate && 
                    stats.successRate >= LOW_PERFORMANCE_THRESHOLD &&
                    !weaknesses.includes(topic) &&
                    !strengths.includes(topic)
                )
                .sort((a, b) => a[1].successRate - b[1].successRate)
                .slice(0, 3 - weaknesses.length)
                .map(([topic]) => topic);
                
            weaknesses.push(...additionalWeaknesses);
        }
        
        return {
            topicStats,
            difficultyStats,
            questionTypeStats,
            strengths,
            weaknesses,
            hasEnoughData: topicsWithEnoughData.length > 0
        };
    }, [user.question_tracking, questionData]);

    if (!analytics.hasEnoughData) {
        return (
            <div className={styles.analyticsContainer}>
                <h2>Performance Analytics</h2>
                <div className={styles.emptyAnalytics}>
                    <p>Complete more questions to see detailed analytics about your performance.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.analyticsContainer}>
            <h2>Performance Analytics</h2>
            
            {/* Strengths and Weaknesses Summary */}
            <div className={styles.insightsSection}>
                <div className={styles.strengthsCard}>
                    <h3>Your Strengths</h3>
                    {analytics.strengths.length > 0 ? (
                        <ul className={styles.insightsList}>
                            {analytics.strengths.map(topic => (
                                <li key={topic}>
                                    <span className={styles.topicName}>{topic}</span>
                                    <span className={styles.successRate}>
                                        {analytics.topicStats[topic].successRate.toFixed(1)}% success
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>Complete more questions to identify your strengths.</p>
                    )}
                </div>
                
                <div className={styles.weaknessesCard}>
                    <h3>Areas for Improvement</h3>
                    {analytics.weaknesses.length > 0 ? (
                        <ul className={styles.insightsList}>
                            {analytics.weaknesses.map(topic => (
                                <li key={topic}>
                                    <span className={styles.topicName}>{topic}</span>
                                    <span className={styles.successRate}>
                                        {analytics.topicStats[topic].successRate.toFixed(1)}% success
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>Complete more questions to identify areas for improvement.</p>
                    )}
                </div>
            </div>
            
            {/* Topic Performance Breakdown */}
            <div className={styles.analyticsSection}>
                <h3>Topic Performance</h3>
                <div className={styles.topicsGrid}>
                    {Object.entries(analytics.topicStats)
                        .sort((a, b) => b[1].total - a[1].total)
                        .map(([topic, stats]) => (
                            <div key={topic} className={styles.topicCard}>
                                <h4>{topic}</h4>
                                <div className={styles.progressBar}>
                                    <div 
                                        className={styles.progressSuccess}
                                        style={{ width: `${stats.success / stats.total * 100}%` }}
                                    />
                                    <div 
                                        className={styles.progressUnsure}
                                        style={{ width: `${stats.unsure / stats.total * 100}%` }}
                                    />
                                    <div 
                                        className={styles.progressFailed}
                                        style={{ width: `${stats.failed / stats.total * 100}%` }}
                                    />
                                </div>
                                <div className={styles.topicStats}>
                                    <div>Success: {stats.success}/{stats.total} ({(stats.success / stats.total * 100).toFixed(1)}%)</div>
                                    <div>Unsure: {stats.unsure}/{stats.total} ({(stats.unsure / stats.total * 100).toFixed(1)}%)</div>
                                    <div>Need Practice: {stats.failed}/{stats.total} ({(stats.failed / stats.total * 100).toFixed(1)}%)</div>
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>
            
            {/* Difficulty Level Performance */}
            <div className={styles.analyticsSection}>
                <h3>Performance by Difficulty</h3>
                <div className={styles.difficultyGrid}>
                    {Object.entries(analytics.difficultyStats)
                        .filter(([_, stats]) => stats.total > 0)
                        .map(([difficulty, stats]) => (
                            <div key={difficulty} className={styles.difficultyCard}>
                                <h4>{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</h4>
                                <div className={styles.difficultyStats}>
                                    <div className={styles.statCircle}>
                                        <svg viewBox="0 0 36 36">
                                            <path
                                                className={styles.circleBackground}
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            />
                                            <path
                                                className={styles.circleProgress}
                                                strokeDasharray={`${stats.successRate}, 100`}
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            />
                                            <text x="18" y="20.35" className={styles.circleText}>
                                                {stats.successRate.toFixed(0)}%
                                            </text>
                                        </svg>
                                    </div>
                                    <div className={styles.attemptCount}>
                                        <span>{stats.total}</span> questions attempted
                                    </div>
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    );
};

export default StudentAnalytics;
