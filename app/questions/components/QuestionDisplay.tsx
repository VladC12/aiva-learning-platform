"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Button from 'app/components/Button';
import MarkdownMathRenderer from 'app/components/MarkdownMathRenderer';
import { useUser } from 'context/UserContext';
import { Question } from '@/models/Question';
import styles from '../page.module.css';
import PdfGenerationControls from './PdfGenerationControls';

interface QuestionStatus {
  success: number;
  failed: number;
  unsure: number;
}

// Regular Question display component
function QuestionDisplay({
    questions,
    questionSetLabel,
    canGeneratePdf = false
}: {
    questions: Question[];
    questionSetLabel?: string;
    canGeneratePdf?: boolean;
}) {
    const router = useRouter();
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [showSolution, setShowSolution] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [sessionStartTime] = useState<number>(Date.now());
    const [sessionEndTime, setSessionEndTime] = useState<number | null>(null);
    const [showExitConfirmation, setShowExitConfirmation] = useState(false);
    const [navigateToPath, setNavigateToPath] = useState<string | null>(null);
    const navAttemptRef = useRef<{action: 'push' | 'back' | 'link', target?: string}>({action: 'push'});
    const [questionStatus, setQuestionStatus] = useState<QuestionStatus>({
        success: 0,
        failed: 0,
        unsure: 0
    });
    
    const currentQuestion = questions[currentQuestionIndex];
    const { user } = useUser();
    
    // Handle beforeunload event to prevent accidental navigation away
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!completed) {
                // Standard way of showing a confirmation dialog before leaving
                const message = "You haven't completed all questions yet. Your progress so far has been saved, but you'll lose this specific combination of questions if you leave now. Are you sure you want to leave?";
                e.preventDefault();
                e.returnValue = message; // Required for some browsers
                return message;
            }
        };
        
        window.addEventListener('beforeunload', handleBeforeUnload);
        
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [completed]);
    
    // Handle browser back/forward buttons
    useEffect(() => {
        const handlePopState = (e: PopStateEvent) => {
            if (!completed) {
                // Prevent the default navigation
                e.preventDefault();
                
                // Store the navigation attempt info
                navAttemptRef.current = {action: 'back'};
                
                // Show confirmation dialog
                setShowExitConfirmation(true);
                
                // Push a duplicate state to prevent immediate navigation
                // This keeps us on the current page until user confirms
                window.history.pushState(null, '', window.location.href);
            }
        };
        
        // Listen for popstate (back/forward buttons)
        window.addEventListener('popstate', handlePopState);
        
        // Push initial state to enable popstate detection
        window.history.pushState(null, '', window.location.href);
        
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [completed]);
    
    // Intercept all link clicks in the document to show confirmation
    useEffect(() => {
        const handleLinkClick = (e: MouseEvent) => {
            if (completed) return; // Don't intercept if completed
            
            // Find closest anchor tag
            const anchor = (e.target as HTMLElement).closest('a');
            if (!anchor) return; // Not a link click
            
            // Skip links inside the ProfileDropdown (by checking for parent with dropdown class)
            const isInProfileDropdown = Boolean(
                (e.target as HTMLElement).closest('[data-dropdown="profile"]')
            );
            if (isInProfileDropdown) return;
            
            // Skip if it's an internal link within the questions page
            if (anchor.getAttribute('href')?.startsWith('#')) return;
            
            // Skip if it has target="_blank" (opens in new tab)
            if (anchor.getAttribute('target') === '_blank') return;
            
            // Skip if it has data-bypass-confirm attribute
            if (anchor.hasAttribute('data-bypass-confirm')) return;
            
            // Skip same-page links
            const href = anchor.getAttribute('href') || '';
            if (href === window.location.pathname) return;
            
            // Prevent default navigation
            e.preventDefault();
            
            // Store navigation info
            navAttemptRef.current = {
                action: 'link',
                target: href
            };
            
            // Show confirmation dialog
            setShowExitConfirmation(true);
        };
        
        // Add capture phase listener to catch all link clicks
        document.addEventListener('click', handleLinkClick, true);
        
        return () => {
            document.removeEventListener('click', handleLinkClick, true);
        };
    }, [completed]);
    
    // Handle exit confirmation dialog
    const handleConfirmExit = () => {
        setShowExitConfirmation(false);
        
        // Get the navigation attempt details
        const navAttempt = navAttemptRef.current;
        
        // Use a short timeout to allow state update to complete
        setTimeout(() => {
            if (navAttempt.action === 'push' && navigateToPath) {
                // Next.js router navigation
                window.location.href = navigateToPath; // Use direct navigation instead
            } else if (navAttempt.action === 'back') {
                // Browser back button - go back twice to skip the history entry we added
                window.history.go(-2);
            } else if (navAttempt.action === 'link' && navAttempt.target) {
                // Link click
                window.location.href = navAttempt.target;
            } else {
                // Fallback to home page if navigation details are missing
                window.location.href = '/';
            }
        }, 10);
    };
    
    const handleCancelExit = () => {
        setShowExitConfirmation(false);
        setNavigateToPath(null);
    };

    // Format time duration into readable string (e.g., "5m 30s")
    const formatDuration = (milliseconds: number): string => {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        if (minutes === 0) {
            return `${remainingSeconds}s`;
        }
        
        return `${minutes}m ${remainingSeconds}s`;
    };

    const getDifficultyClass = (difficulty: string) => {
        const firstWord = difficulty.split(' ')[0].toLowerCase();
        return `difficulty-${firstWord}`;
    };

    const handlePrev = () => {
        setCurrentQuestionIndex((prev: number) => Math.max(0, prev - 1));
        setShowSolution(false);
    };

    const handleNext = () => {
        const nextIndex = currentQuestionIndex + 1;
        
        if (nextIndex >= questions.length) {
            // If we've reached the end, show completion screen
            setSessionEndTime(Date.now());
            setCompleted(true);
        } else {
            setCurrentQuestionIndex(nextIndex);
            setShowSolution(false);
        }
    };

    const handleMarkQuestion = async (status: 'success' | 'failed' | 'unsure') => {
        if (!user || !currentQuestion._id) {
            console.error("User not logged in or question ID missing");
            return;
        }

        try {
            setIsSubmitting(true);
            const response = await fetch('/api/track-student-questions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    questionId: currentQuestion._id.toString(),
                    status,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to track question status');
            }

            // Update the question status count
            setQuestionStatus(prev => ({
                ...prev,
                [status]: prev[status] + 1
            }));

            // Move to next question after tracking
            handleNext();
        } catch (error) {
            console.error('Error tracking question:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReturnHome = () => {
        if (completed) {
            router.push('/');
        } else {
            navAttemptRef.current = {
                action: 'push',
                target: '/'
            };
            setNavigateToPath('/');
            setShowExitConfirmation(true);
        }
    };
    
    // Calculate stats for completed screen
    const totalQuestions = questions.length;
    const totalAnswered = questionStatus.success + questionStatus.failed + questionStatus.unsure;
    const successRate = totalAnswered > 0 ? Math.round((questionStatus.success / totalAnswered) * 100) : 0;
    const sessionDuration = sessionEndTime ? formatDuration(sessionEndTime - sessionStartTime) : '';

    // Render exit confirmation dialog as a modal overlay
    const exitConfirmationModal = (
        <div className={styles.modalOverlay} style={{ display: showExitConfirmation ? 'flex' : 'none' }}>
            <div className={styles.modalContent}>
                <h2 className={styles.modalTitle}>Are you sure you want to leave?</h2>
                <p className={styles.modalMessage}>
                    You haven't completed all questions yet. Your progress so far has been saved, 
                    but you'll lose this specific combination of questions if you leave now.
                </p>
                <div className={styles.modalButtons}>
                    <Button variant="primary" onClick={handleCancelExit}>
                        Stay on this page
                    </Button>
                    <Button variant="failed" onClick={handleConfirmExit}>
                        Leave anyway
                    </Button>
                </div>
            </div>
        </div>
    );

    // Render completion screen if all questions are completed
    if (completed) {
        return (
            <div className={styles.completionContainer}>
                <div className={styles.completionCard}>
                    <h1 className={styles.completionTitle}>Congratulations! 🎉</h1>
                    <p className={styles.completionMessage}>
                        You've completed all {totalQuestions} questions in the set!
                    </p>
                    
                    <div className={styles.completionStats}>
                        <div className={styles.statItem}>
                            <span className={styles.statLabel}>Time spent:</span>
                            <span className={styles.statValue}>{sessionDuration}</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statLabel}>Questions completed:</span>
                            <span className={styles.statValue}>{totalAnswered} / {totalQuestions}</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statLabel}>Success rate:</span>
                            <span className={styles.statValue}>{successRate}%</span>
                        </div>
                    </div>
                    
                    <div className={styles.resultsBreakdown}>
                        <h3>Results breakdown:</h3>
                        <div className={styles.resultsGrid}>
                            <div className={`${styles.resultBox} ${styles.successBox}`}>
                                <span className={styles.resultCount}>{questionStatus.success}</span>
                                <span className={styles.resultLabel}>Success</span>
                            </div>
                            <div className={`${styles.resultBox} ${styles.unsureBox}`}>
                                <span className={styles.resultCount}>{questionStatus.unsure}</span>
                                <span className={styles.resultLabel}>Unsure</span>
                            </div>
                            <div className={`${styles.resultBox} ${styles.failedBox}`}>
                                <span className={styles.resultCount}>{questionStatus.failed}</span>
                                <span className={styles.resultLabel}>Failed</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className={styles.completionActions}>
                        <Button variant="primary" onClick={handleReturnHome}>
                            Return to Home
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Add the modal to the main UI instead of replacing it */}
            {exitConfirmationModal}
            
            <div className={styles.sidebar}>
                {canGeneratePdf && <div className={styles.pdfControls}>
                    <PdfGenerationControls
                        questions={questions}
                        questionSetLabel={questionSetLabel}
                    />
                </div>}
                <div className={styles.questionCount}>
                    Question: {`${currentQuestionIndex + 1} / ${questions.length}`}
                </div>
                <div className={styles.information}>
                    <div><strong>Education Board:</strong> {currentQuestion.education_board}</div>
                    <div><strong>Class:</strong> {currentQuestion.class}</div>
                    <div><strong>Topic:</strong> {currentQuestion.topic}</div>
                    <div><strong>Subject:</strong> {currentQuestion.subject}</div>
                    <div><strong>Type:</strong> {currentQuestion.q_type}</div>
                    <div><strong>Number*:</strong>{currentQuestion.q_number}</div>
                    <div><strong>Difficulty:</strong> <span className={`${styles.difficulty} ${styles[getDifficultyClass(currentQuestion.difficulty_level)]}`}>
                        {currentQuestion.difficulty_level}
                    </span></div>
                </div>
            </div>

            <div className={styles.mainContent}>
                <div className={styles.questionArea}>
                    <div className={styles.questionContent}>
                        <br />
                        <MarkdownMathRenderer content={currentQuestion.question} />
                    </div>

                    {showSolution && (
                        <div className={styles.solution}>
                            <MarkdownMathRenderer content={currentQuestion.solution} />
                            <div className={styles.markButtons}>
                                <Button
                                    variant="failed"
                                    onClick={() => handleMarkQuestion('failed')}
                                    disabled={isSubmitting}
                                >
                                    Failed
                                </Button>
                                <Button
                                    variant="unsure"
                                    onClick={() => handleMarkQuestion('unsure')}
                                    disabled={isSubmitting}
                                >
                                    Unsure
                                </Button>
                                <Button
                                    variant="success"
                                    onClick={() => handleMarkQuestion('success')}
                                    disabled={isSubmitting}
                                >
                                    Success
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <div className={styles.navigation}>
                    <div className={styles.buttonGroup}>
                        <Button onClick={handlePrev} disabled={currentQuestionIndex === 0}>Prev</Button>
                        <Button onClick={() => setShowSolution(!showSolution)}>
                            {showSolution ? "Hide Solution" : "Show Solution"}
                        </Button>
                        <Button onClick={handleNext} disabled={currentQuestionIndex === questions.length - 1}>Next</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default QuestionDisplay;