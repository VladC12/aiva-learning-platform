import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Question, TrackedQuestion } from '@/models/Question';
import { UserData } from 'context/UserContext';
import styles from './StudentProfile.module.css';
import QuestionModal from './QuestionModal';
import Link from 'next/link';

interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

interface PdfQuestionSet {
    _id: string;
    label: string;
    question_pdf_blob: string;
    solution_pdf_blob: string;
}

interface QuestionHistoryProps {
    user: UserData;
}

const QuestionHistory: React.FC<QuestionHistoryProps> = ({ user }) => {
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
    const historyContainerRef = useRef<HTMLDivElement>(null);
    
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

    // Create a memoized question item component to prevent unnecessary re-renders
    // eslint-disable-next-line
    const QuestionItem = React.memo(({ id, data, onViewQuestion }: { 
        id: string, 
        data: TrackedQuestion, 
        onViewQuestion: (question: Question | null) => void 
    }) => {
        const isPdf = data.isPdfQuestionSet;
        return (
            <div className={styles.questionItem}>
                <div className={styles.questionSubject}>
                    {isPdf && data.question?.label
                        ? data.question.label
                        : data.question?.subject || 'Unknown'}
                </div>
                <div className={styles.questionNumber}>
                    {data.question?.q_number || '-'}
                </div>
                <div className={styles.questionTitle}>
                    <button 
                        className={styles.viewQuestionButton} 
                        onClick={() => onViewQuestion(data.question)}
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
    });

    QuestionItem.displayName = 'QuestionItem';

    // Pagination controls component
    const PaginationControls = React.memo(({ 
        pagination, 
        handlePageChange 
    }: { 
        pagination: PaginationInfo, 
        handlePageChange: (newPage: number, e: React.MouseEvent) => void 
    }) => (
        <div className={styles.paginationControls}>
            <button 
                className={styles.paginationButton}
                disabled={pagination.page <= 1}
                onClick={(e) => handlePageChange(pagination.page - 1, e)}
            >
                Previous
            </button>
            <span className={styles.pageInfo}>
                Page {pagination.page} of {pagination.totalPages}
            </span>
            <button 
                className={styles.paginationButton}
                disabled={pagination.page >= pagination.totalPages}
                onClick={(e) => handlePageChange(pagination.page + 1, e)}
            >
                Next
            </button>
        </div>
    ));

    PaginationControls.displayName = 'PaginationControls';

    // Memoize the handleViewQuestion function to prevent recreating it on each render
    const handleViewQuestion = useCallback((question: Question | null) => {
        if (!question) return;
        setSelectedQuestion(question);
        setShowModal(true);
    }, []);

    const closeModal = useCallback(() => {
        setShowModal(false);
        setSelectedQuestion(null);
    }, []);

    // Memoize the handlePageChange function
    const handlePageChange = useCallback((newPage: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        setPagination(prev => ({
            ...prev,
            page: newPage
        }));
    }, []);

    // Memoize the question list to prevent unnecessary re-renders
    const questionList = useMemo(() => {
        return Object.entries(trackedQuestions).map(([id, data]) => (
            <QuestionItem 
                key={id} 
                id={id} 
                data={data} 
                onViewQuestion={handleViewQuestion} 
            />
        ));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trackedQuestions, handleViewQuestion]);

    // Memoize pagination controls
    const paginationComponent = useMemo(() => {
        return <PaginationControls pagination={pagination} handlePageChange={handlePageChange} />;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination, handlePageChange]);

    return (
        <div ref={historyContainerRef} className={styles.questionHistory}>
            <h2>Question History</h2>
            {loadingQuestions ? (
                <div className={styles.loading}>Loading question history...</div>
            ) : allQuestionIds.length > 0 ? (
                <>
                    <div className={styles.questionList}>
                        <div className={styles.questionHeader}>
                            <div className={styles.questionSubject}>Subject</div>
                            <div className={styles.questionNumber}>Q#</div>
                            <div className={styles.questionTitle}>Question</div>
                            <div className={styles.questionStatus}>Status</div>
                            <div className={styles.questionAttempts}>Attempts</div>
                            <div className={styles.questionDate}>Last Attempted</div>
                        </div>
                        {questionList}
                    </div>
                    
                    {paginationComponent}
                </>
            ) : (
                <div className={styles.emptyState}>
                    <p>You haven&apos;t attempted any questions yet.</p>
                    <Link href="/questions" className={styles.exploreButton}>
                        Explore Questions
                    </Link>
                </div>
            )}
            
            {selectedQuestion && (
                <QuestionModal 
                    question={selectedQuestion} 
                    isOpen={showModal} 
                    onClose={closeModal} 
                />
            )}
        </div>
    );
};

export default React.memo(QuestionHistory);
