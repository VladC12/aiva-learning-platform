import styles from './StudentProfile.module.css'
import Link from 'next/link';
import { Question, TrackedQuestion } from '@/models/Question';
import { UserData } from 'context/UserContext';
import { useEffect, useState } from 'react';
import QuestionModal from './QuestionModal';
import QuestionList from './QuestionList';

interface Props {
    user: UserData;
}

interface PdfQuestionSet {
    _id: string;
    label: string;
    question_pdf_blob: string;
    solution_pdf_blob: string;
}


interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

const StudentProfile: React.FC<Props> = ({ user }) => {
    const [trackedQuestions, setTrackedQuestions] = useState<Record<string, TrackedQuestion>>({});
    const [loadingQuestions, setLoadingQuestions] = useState<boolean>(true);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
    const [pagination, setPagination] = useState<PaginationInfo>({
        page: 1,
        limit: 5,
        total: 0,
        totalPages: 0
    });
    const [allQuestionIds, setAllQuestionIds] = useState<string[]>([]);
    
    useEffect(() => {
        // Store all question IDs for pagination
        if (user?.question_tracking) {
            const ids = Object.keys(user.question_tracking);
            // Sort by timestamp (most recent first)
            const sortedIds = [...ids].sort((a, b) => {
                const timestampA = user.question_tracking?.[a]?.timestamp || 0;
                const timestampB = user.question_tracking?.[b]?.timestamp || 0;
                return timestampB - timestampA;
            });
            setAllQuestionIds(sortedIds);
            setPagination(prev => ({
                ...prev,
                total: sortedIds.length,
                totalPages: Math.ceil(sortedIds.length / prev.limit)
            }));
        }
    }, [user?.question_tracking]);

    useEffect(() => {
        // Only fetch question details if the user has question tracking data
        if (!user || !user._id || !user.question_tracking || allQuestionIds.length === 0) {
            setLoadingQuestions(false);
            return;
        }

        const fetchQuestionDetails = async () => {
            try {
                setLoadingQuestions(true);
                
                // Get the paginated slice of question IDs
                const startIndex = (pagination.page - 1) * pagination.limit;
                const endIndex = startIndex + pagination.limit;
                const paginatedIds = allQuestionIds.slice(startIndex, endIndex);

                if (paginatedIds.length === 0) {
                    setLoadingQuestions(false);
                    return;
                }

                // Group IDs by type: regular questions and PDF sets
                const regularQuestionIds: string[] = [];
                const pdfSetIds: string[] = [];
                
                paginatedIds.forEach(id => {
                    const tracking = user.question_tracking?.[id];
                    if (tracking) {
                        if (tracking.isPdfQuestionSet) {
                            pdfSetIds.push(id);
                        } else {
                            regularQuestionIds.push(id);
                        }
                    }
                });

                const trackedWithDetails: Record<string, TrackedQuestion> = {};

                if (regularQuestionIds.length > 0) {
                    const regularResponse = await fetch(
                        `/api/questions/batch?ids=${regularQuestionIds.join(',')}&page=1&limit=${regularQuestionIds.length}`
                    );

                    if (!regularResponse.ok) {
                        throw new Error('Failed to fetch question details');
                    }

                    const questionsData = await regularResponse.json();
                    
                    // Add regular questions to tracked questions
                    regularQuestionIds.forEach(id => {
                        const tracking = user.question_tracking?.[id];
                        if (tracking) {
                            trackedWithDetails[id] = {
                                question: questionsData.questions.find((q: Question) => q._id.toString() === id) || null,
                                status: tracking.status,
                                timestamp: tracking.timestamp,
                                attempts: tracking.attempts || 1,
                                isPdfQuestionSet: false
                            };
                        }
                    });
                }

                if (pdfSetIds.length > 0) {
                    // Fetch PDF question sets
                    const pdfSetsResponse = await fetch('/api/pdf-question-sets', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ ids: pdfSetIds }),
                    });

                    if (!pdfSetsResponse.ok) {
                        throw new Error('Failed to fetch PDF question sets');
                    }

                    const pdfSetsData = await pdfSetsResponse.json() as PdfQuestionSet[];
                    
                    // Add PDF sets to tracked questions
                    pdfSetIds.forEach(id => {
                        const tracking = user.question_tracking?.[id];
                        const pdfSet = pdfSetsData.find((set: PdfQuestionSet) => set._id.toString() === id);
                        
                        if (tracking && pdfSet) {
                            trackedWithDetails[id] = {
                                question: {
                                    _id: pdfSet._id,
                                    subject: 'PDF Exam',
                                    topic: pdfSet.label,
                                    question: '',
                                    solution: '',
                                    difficulty_level: 'Mixed',
                                    class: '',
                                    question_pdf_blob: pdfSet.question_pdf_blob,
                                    solution_pdf_blob: pdfSet.solution_pdf_blob,
                                    label: pdfSet.label
                                },
                                status: tracking.status,
                                timestamp: tracking.timestamp,
                                attempts: tracking.attempts || 1,
                                isPdfQuestionSet: true
                            };
                        }
                    });
                }

                setTrackedQuestions(trackedWithDetails);
            } catch (error) {
                console.error('Error fetching question details:', error);
            } finally {
                setLoadingQuestions(false);
            }
        };

        fetchQuestionDetails();
    }, [user, allQuestionIds, pagination.page, pagination.limit]);

    const handleViewQuestion = (question: Question | null) => {
        if (!question) return;
        setSelectedQuestion(question);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedQuestion(null);
    };

    const handlePageChange = (newPage: number) => {
        setPagination(prev => ({
            ...prev,
            page: newPage
        }));
    };

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

            <div className={styles.questionHistory}>
                <h2>Question History</h2>
                {loadingQuestions ? (
                    <div className={styles.loading}>Loading question history...</div>
                ) : allQuestionIds.length > 0 ? (
                    <>
                        <div className={styles.questionList}>
                            <div className={styles.questionHeader}>
                                <div className={styles.questionSubject}>Subject</div>
                                <div className={styles.questionTitle}>Question</div>
                                <div className={styles.questionStatus}>Status</div>
                                <div className={styles.questionAttempts}>Attempts</div>
                                <div className={styles.questionDate}>Last Attempted</div>
                            </div>
                            {Object.entries(trackedQuestions)
                                .map(([id, data]) => {
                                    const isPdf = data.isPdfQuestionSet;
                                    return (
                                        <div key={id} className={styles.questionItem}>
                                            <div className={styles.questionSubject}>
                                                {isPdf && data.question?.label
                                                    ? data.question.label
                                                    : data.question?.subject || 'Unknown'}
                                            </div>
                                            <div className={styles.questionTitle}>
                                                <button 
                                                    className={styles.viewQuestionButton} 
                                                    onClick={() => handleViewQuestion(data.question)}
                                                >
                                                    {isPdf ? 'View Set Documents' : 'View Question'}
                                                </button>
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
                                    );
                                })}
                        </div>
                        
                        {/* Pagination controls */}
                        <div className={styles.paginationControls}>
                            <button 
                                className={styles.paginationButton}
                                disabled={pagination.page <= 1}
                                onClick={() => handlePageChange(pagination.page - 1)}
                            >
                                Previous
                            </button>
                            <span className={styles.pageInfo}>
                                Page {pagination.page} of {pagination.totalPages}
                            </span>
                            <button 
                                className={styles.paginationButton}
                                disabled={pagination.page >= pagination.totalPages}
                                onClick={() => handlePageChange(pagination.page + 1)}
                            >
                                Next
                            </button>
                        </div>
                    </>
                ) : (
                    <div className={styles.emptyState}>
                        <p>You haven&apos;t attempted any questions yet.</p>
                        <Link href="/questions" className={styles.exploreButton}>
                            Explore Questions
                        </Link>
                    </div>
                )}
            </div>

            {selectedQuestion && (
                <QuestionModal 
                    question={selectedQuestion} 
                    isOpen={showModal} 
                    onClose={closeModal} 
                />
            )}
        </div>
    );
}

export default StudentProfile