import React, { useState } from 'react';
import { UserData } from 'context/UserContext';
import styles from './StudentProfile.module.css';

interface QuestionSetHistoryProps {
    user: UserData;
}

const QuestionSetHistory: React.FC<QuestionSetHistoryProps> = ({ user }) => {
    const [sortBy, setSortBy] = useState<string>('date');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const itemsPerPage = 6; // 2 rows with 3 items each typically

    // Check if there's any question set data
    if (!user.question_sets_tracking || Object.keys(user.question_sets_tracking).length === 0) {
        return (
            <div className={styles.analyticsContainer}>
                <h2>Question Set History</h2>
                <div className={styles.emptyAnalytics}>
                    <p>You haven&apos;t completed any question sets yet.</p>
                    <p>Complete a question set to see your performance statistics here.</p>
                </div>
            </div>
        );
    }

    // Convert object to array for sorting
    const completedSets = Object.entries(user.question_sets_tracking).map(([id, stats]) => ({
        id,
        ...stats
    }));

    // Sort completed sets
    const sortedSets = [...completedSets];
    if (sortBy === 'date') {
        sortedSets.sort((a, b) => b.completedAt - a.completedAt);
    } else if (sortBy === 'score') {
        sortedSets.sort((a, b) => b.successRate - a.successRate);
    }

    // Pagination
    const totalPages = Math.ceil(sortedSets.length / itemsPerPage);
    const paginatedSets = sortedSets.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Format duration from milliseconds to minutes:seconds
    const formatDuration = (ms: number): string => {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // Format date in a simple way without external libraries
    const formatDate = (timestamp: number): string => {
        const date = new Date(timestamp);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    return (
        <div className={styles.analyticsContainer}>
            <div className={styles.analyticsHeader}>
                <h2>Question Set History</h2>
                <div className={styles.controls}>
                    <select 
                        className={styles.sortSelect} 
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="date">Sort by Date</option>
                        <option value="score">Sort by Score</option>
                    </select>
                </div>
            </div>

            <div className={styles.analyticsSection}>
                <div className={styles.compactTopicsGrid}>
                    {paginatedSets.map((set) => (
                        <div key={set.id} className={styles.compactTopicCard}>
                            <div className={styles.cardHeader}>
                                <h4>{set.questionSetLabel}</h4>
                                <div className={styles.completionDate}>
                                    <span className={styles.smallDuration}>Duration: {formatDuration(set.sessionDuration)}</span> • {formatDate(set.completedAt)}
                                </div>
                            </div>

                            {/* Progress bar showing success/unsure/failed rate */}
                            <div className={styles.progressBar}>
                                <div 
                                    className={styles.progressSuccess}
                                    style={{ 
                                        width: `${(set.results.success / set.totalQuestions) * 100}%` 
                                    }}
                                />
                                <div 
                                    className={styles.progressUnsure}
                                    style={{ 
                                        width: `${(set.results.unsure / set.totalQuestions) * 100}%` 
                                    }}
                                />
                                <div 
                                    className={styles.progressFailed}
                                    style={{ 
                                        width: `${(set.results.failed / set.totalQuestions) * 100}%` 
                                    }}
                                />
                            </div>

                            <div className={styles.topicStats}>
                                <div>Success: {set.results.success}/{set.totalQuestions} ({(set.results.success / set.totalQuestions * 100).toFixed(1)}%)</div>
                                <div>Unsure: {set.results.unsure}/{set.totalQuestions} ({(set.results.unsure / set.totalQuestions * 100).toFixed(1)}%)</div>
                                <div>Need Practice: {set.results.failed}/{set.totalQuestions} ({(set.results.failed / set.totalQuestions * 100).toFixed(1)}%)</div>
                            </div>
                        </div>
                    ))}
                </div>
                
                {totalPages > 1 && (
                    <div className={styles.paginationControls}>
                        <button 
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className={styles.paginationButton}
                        >
                            Previous
                        </button>
                        <span className={styles.pageInfo}>
                            Page {currentPage} of {totalPages}
                        </span>
                        <button 
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className={styles.paginationButton}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuestionSetHistory;
