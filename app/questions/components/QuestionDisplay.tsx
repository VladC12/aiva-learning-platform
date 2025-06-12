"use client";
import { useState } from 'react';
import Button from 'app/components/Button';
import MarkdownMathRenderer from 'app/components/MarkdownMathRenderer';
import { useUser } from 'context/UserContext';
import { Question } from '@/models/Question';
import styles from '../page.module.css';

// Regular Question display component
function QuestionDisplay({ questions }: { questions: Question[] }) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [showSolution, setShowSolution] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const currentQuestion = questions[currentQuestionIndex];
    const { user } = useUser();

    const getDifficultyClass = (difficulty: string) => {
        const firstWord = difficulty.split(' ')[0].toLowerCase();
        return `difficulty-${firstWord}`;
    };

    const handlePrev = () => {
        setCurrentQuestionIndex((prev: number) => Math.max(0, prev - 1));
        setShowSolution(false);
    };

    const handleNext = () => {
        setCurrentQuestionIndex((prev: number) => Math.min(questions.length - 1, prev + 1));
        setShowSolution(false);
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

            // Move to next question after tracking
            handleNext();
        } catch (error) {
            console.error('Error tracking question:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.sidebar}>
                <div className={styles.questionCount}>
                    Question: {`${currentQuestionIndex + 1} / ${questions.length}`}
                </div>
                <div className={styles.information}>
                    <div><strong>Education Board:</strong> {currentQuestion.education_board}</div>
                    <div><strong>Class:</strong> {currentQuestion.class}</div>
                    <div><strong>Topic:</strong> {currentQuestion.topic}</div>
                    <div><strong>Subject:</strong> {currentQuestion.subject}</div>
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