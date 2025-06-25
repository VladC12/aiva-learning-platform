"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { useUser } from 'context/UserContext';
import QuestionModal from '../components/QuestionModal';
import { Question, FilterOption, FilterState, PaginationState } from '../../models/Question';
import { fetchFilters, fetchQuestions, fetchQuestionCount } from '../../lib/questionApi';
import FilterSidebar from './components/FilterSidebar';
import QuestionList from './components/QuestionList';
import PaginationControls from './components/PaginationControls';
import QuestionCountDisplay from './components/QuestionCountDisplay';
import QuestionSetBuilder from './components/QuestionSetBuilder';

export default function Bank() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [filterOptions, setFilterOptions] = useState<Record<string, FilterOption>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [showQuestionSetBuilder, setShowQuestionSetBuilder] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    education_board: '',
    class: '',
    subject: '',
    topic: [],
    difficulty_level: [],
    inCourse: [],
    isHOTS: [],
    isCorrect: [],
    q_type: []
  });

  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Redirect non-reviewer/non-moderator/non-teacher users
  useEffect(() => {
    if (!userLoading && user && user.type !== 'reviewer' && user.type !== 'moderator' && user.type !== 'teacher') {
      router.push('/');
    }
  }, [user, userLoading, router]);

  // Fetch filter options
  useEffect(() => {
    const getFilters = async () => {
      try {
        setIsLoading(true);
        const data = await fetchFilters();

        // Convert array to an object with keys for easier access
        const filtersObj: Record<string, FilterOption> = {};
        data.forEach((filter: FilterOption) => {
          filtersObj[filter.key] = filter;
        });

        setFilterOptions(filtersObj);

        // Set default values for filters with only one option
        if (filtersObj.education_board && filtersObj.education_board.content.length === 1) {
          setFilters(prev => ({
            ...prev,
            education_board: filtersObj.education_board.content[0]
          }));
        }

        if (filtersObj.class && filtersObj.class.content.length === 1) {
          setFilters(prev => ({
            ...prev,
            class: filtersObj.class.content[0]
          }));
        }

        if (filtersObj.subject && filtersObj.subject.content.length === 1) {
          setFilters(prev => ({
            ...prev,
            subject: filtersObj.subject.content[0]
          }));
        }

        // Set default difficulty levels if available
        if (filtersObj.difficulty_level) {
          setFilters(prev => ({
            ...prev,
            difficulty_level: filtersObj.difficulty_level.content
          }));
        }
      } catch (error) {
        console.error("Error fetching filters:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getFilters();
  }, []);

  // Fetch questions based on filters and pagination
  useEffect(() => {
    const getQuestions = async () => {
      if (userLoading) return;

      try {
        setIsLoading(true);
        const isModerator = user?.type === 'moderator';

        const questionsData = await fetchQuestions(
          filters,
          { page: pagination.page, limit: pagination.limit },
          isModerator
        );
        
        setQuestions(questionsData);
      } catch (error) {
        console.error("Error fetching questions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!userLoading && user && (user.type === 'reviewer' || user.type === 'moderator' || user.type === 'teacher')) {
      getQuestions();
    }
  }, [filters, pagination.page, pagination.limit, user, userLoading]);

  // Fetch question count
  useEffect(() => {
    const getCount = async () => {
      if (userLoading || !user) return;

      try {
        const isModerator = user.type === 'moderator';
        const countData = await fetchQuestionCount(filters, isModerator);
        
        setPagination(prev => ({
          ...prev,
          total: countData.count,
          totalPages: Math.ceil(countData.count / prev.limit)
        }));
      } catch (error) {
        console.error("Error fetching question count:", error);
      }
    };

    if (user?.type === 'reviewer' || user?.type === 'moderator' || user?.type === 'teacher') {
      getCount();
    }
  }, [filters, pagination.limit, user, userLoading]);

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
    
    // Reset to first page when filter changes
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const handleLimitChange = (newLimit: number) => {
    setPagination(prev => ({
      ...prev,
      limit: newLimit,
      page: 1
      // We'll let the useEffect calculate totalPages based on the new count
    }));
  };

  const handleQuestionUpdate = (updatedQuestion: Question) => {
    setQuestions(questions.map(q =>
      q._id === updatedQuestion._id ? updatedQuestion : q
    ));
  };

  const handleViewQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedQuestion(null);
  };

  const handleToggleSelectQuestion = (question: Question) => {
    setSelectedQuestions(prev => {
      const isAlreadySelected = prev.some(q => q._id === question._id);
      if (isAlreadySelected) {
        return prev.filter(q => q._id !== question._id);
      } else {
        return [...prev, question];
      }
    });
  };

  const handleCreateQuestionSet = () => {
    setShowQuestionSetBuilder(prev => !prev);
  };

  const handleCloseQuestionSetBuilder = () => {
    setShowQuestionSetBuilder(false);
  };

  const handleQuestionSetSuccess = () => {
    setShowQuestionSetBuilder(false);
    setSelectedQuestions([]);
  };

  // If loading or not a reviewer/moderator/teacher, show loading
  if (userLoading || (user && user.type !== 'reviewer' && user.type !== 'moderator' && user.type !== 'teacher')) {
    return <div className={styles.loading}>Loading...</div>;
  }

  // If not logged in or not a reviewer, redirect
  if (!user) {
    router.push('/auth/login');
    return null;
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Question Bank Management</h1>
          <p>View and manage all questions in the database</p>
        </div>

        <div className={showQuestionSetBuilder ? styles.contentWithBuilder : styles.contentGrid}>
          {/* Filters sidebar */}
          <FilterSidebar
            filterOptions={filterOptions}
            filters={filters}
            onFilterChange={handleFilterChange}
          />

          {/* Questions content */}
          <div className={styles.content}>
            {isLoading ? (
              <div className={styles.loading}>Loading questions...</div>
            ) : (
              <>
                <QuestionCountDisplay
                  total={pagination.total}
                  limit={pagination.limit}
                  onLimitChange={handleLimitChange}
                />

                {user.type === 'teacher' && (
                  <div className={styles.selectionToolbar}>
                    <div className={styles.selectionInfo}>
                      {selectedQuestions.length > 0 ? (
                        <>
                          <span>{selectedQuestions.length} questions selected</span>
                          <button 
                            className={styles.deselectAllButton} 
                            onClick={() => setSelectedQuestions([])}
                            title="Deselect all questions"
                          >
                            Clear
                          </button>
                        </>
                      ) : (
                        'Select questions to create a question set'
                      )}
                    </div>
                    <button
                      className={styles.createSetButton}
                      onClick={handleCreateQuestionSet}
                    >
                      {showQuestionSetBuilder ? 'Hide Builder' : 'Create Question Set'}
                    </button>
                  </div>
                )}

                <QuestionList
                  questions={questions}
                  filterOptions={filterOptions}
                  isModerator={user.type === 'moderator'}
                  isReviewer={user.type === 'reviewer'}
                  isReadOnly={user.type === 'teacher'}
                  onQuestionUpdate={handleQuestionUpdate}
                  onViewQuestion={handleViewQuestion}
                  onToggleSelectQuestion={handleToggleSelectQuestion}
                  selectedQuestions={selectedQuestions}
                  isSelectable={user.type === 'teacher'}
                />

                {questions.length > 0 && (
                  <PaginationControls
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                  />
                )}
              </>
            )}
          </div>

          {/* Question Set Builder Sidebar */}
          {showQuestionSetBuilder && (
            <QuestionSetBuilder
              selectedQuestions={selectedQuestions}
              onClose={handleCloseQuestionSetBuilder}
              onSuccess={handleQuestionSetSuccess}
            />
          )}
        </div>
      </div>

      {selectedQuestion && (
        <QuestionModal
          question={selectedQuestion}
          isOpen={showModal}
          onClose={closeModal}
        />
      )}
    </main>
  );
}