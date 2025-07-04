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
  const [allFilters, setAllFilters] = useState<FilterOption[]>([]);

  const [filters, setFilters] = useState<FilterState>({
    education_board: '',
    class: '',
    subject: '',
    topic: [],
    difficulty_level: [],
    inCourse: [],
    isHOTS: [],
    isCorrect: [],
    q_type: [],
    q_number: ''
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

        // Store all filters for later use
        setAllFilters(data);

        // Convert array to an object with keys for easier access
        const filtersObj: Record<string, FilterOption> = {};
        data.forEach((filter: FilterOption) => {
          filtersObj[filter.key] = filter;
        });

        // Filter education_board options based on user permissions if applicable
        if (user?.education_board && Array.isArray(user.education_board) && user.education_board.length > 0 && filtersObj.education_board) {
          filtersObj.education_board.content = filtersObj.education_board.content.filter(
            board => user.education_board!.includes(board)
          );
        }

        setFilterOptions(filtersObj);

        // Set default values for filters with only one option
        if (filtersObj.education_board) {
          // Determine the default education board
          let defaultBoard = '';
          
          // First priority: Use user permissions if available
          if (user?.education_board && Array.isArray(user.education_board) && user.education_board.length > 0) {
            // Find the first board the user has access to
            defaultBoard = user.education_board[0];
          } 
          // Second priority: Use the first available board
          else if (filtersObj.education_board.content.length > 0) {
            defaultBoard = filtersObj.education_board.content[0];
          }
          
          // Set the default board
          setFilters(prev => ({
            ...prev,
            education_board: defaultBoard
          }));
          
          // Update the filter options based on the selected board
          if (defaultBoard) {
            // Find relevant child filters for this education board
            const relevantFilters = data.filter((filter: FilterOption) => 
              !filter.parent || filter.parent === defaultBoard
            );
            
            // Update filter options
            const updatedFilterOptions = { ...filtersObj };
            relevantFilters.forEach((filter: FilterOption) => {
              updatedFilterOptions[filter.key] = filter;
            });
            
            setFilterOptions(updatedFilterOptions);
            
            // Set default values for class and subject if they have only one option
            const classFilter = relevantFilters.find((f: FilterOption) => f.key === 'class' && f.parent === defaultBoard);
            if (classFilter && classFilter.content.length === 1) {
              setFilters(prev => ({
                ...prev,
                class: classFilter.content[0]
              }));
            }
            
            const subjectFilter = relevantFilters.find((f: FilterOption) => f.key === 'subject' && f.parent === defaultBoard);
            if (subjectFilter && subjectFilter.content.length === 1) {
              setFilters(prev => ({
                ...prev,
                subject: subjectFilter.content[0]
              }));
            }
          }
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
  }, [user]);

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

  // Effect to update filter options when education_board changes
  useEffect(() => {
    if (filters.education_board && allFilters.length > 0) {
      // Find relevant child filters for this education board
      const selectedBoard = filters.education_board;
      const relevantFilters = allFilters.filter((filter: FilterOption) => 
        !filter.parent || filter.parent === selectedBoard
      );
      
      // Update filter options
      const updatedFilterOptions: Record<string, FilterOption> = { 
        education_board: filterOptions.education_board // Keep the original education_board filter
      };
      
      // Add all relevant filters (global ones and ones specific to this board)
      relevantFilters.forEach((filter: FilterOption) => {
        updatedFilterOptions[filter.key] = filter;
      });
      
      setFilterOptions(updatedFilterOptions);
    }
  }, [filters.education_board, allFilters, filterOptions.education_board]);

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    // Check if education_board has changed
    if (newFilters.education_board && newFilters.education_board !== filters.education_board) {
      const selectedBoard = newFilters.education_board;
      
      // Find relevant child filters for this education board
      const relevantFilters = allFilters.filter((filter: FilterOption) => 
        !filter.parent || filter.parent === selectedBoard
      );
      
      // Update filter options
      const updatedFilterOptions: Record<string, FilterOption> = { 
        education_board: filterOptions.education_board // Keep the original education_board filter
      };
      
      // Add all relevant filters (global ones and ones specific to this board)
      relevantFilters.forEach((filter: FilterOption) => {
        updatedFilterOptions[filter.key] = filter;
      });
      
      setFilterOptions(updatedFilterOptions);
      
      // Reset child filters when education board changes
      setFilters(prev => ({
        ...prev,
        ...newFilters,
        class: '',
        subject: '',
        topic: [],
        q_type: []
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        ...newFilters
      }));
    }
    
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
      
      // If question is already selected, just remove it
      if (isAlreadySelected) {
        return prev.filter(q => q._id !== question._id);
      } else {
        // Check limits for DPS format
        const qType = question.q_type || '';
        
        // Count how many questions of each type we already have
        const counts = prev.reduce((acc, q) => {
          const type = q.q_type || '';
          if (!acc[type]) acc[type] = 0;
          acc[type]++;
          return acc;
        }, {} as Record<string, number>);
        
        // Check limits for each question type
        if (qType === 'MCQ' && (counts['MCQ'] || 0) >= 18) {
          alert('You can only select up to 18 MCQ questions for Section A');
          return prev;
        } else if (qType === 'A-R' && (counts['A-R'] || 0) >= 2) {
          alert('You can only select up to 2 A-R questions for Section A');
          return prev;
        } else if (qType === 'VSA' && (counts['VSA'] || 0) >= 5) {
          alert('You can only select up to 5 VSA questions for Section B');
          return prev;
        } else if (qType === 'SA' && (counts['SA'] || 0) >= 6) {
          alert('You can only select up to 6 SA questions for Section C');
          return prev;
        } else if (qType === 'LA' && (counts['LA'] || 0) >= 4) {
          alert('You can only select up to 4 LA questions for Section D');
          return prev;
        } else if (qType === 'Case-Study' && (counts['Case-Study'] || 0) >= 3) {
          alert('You can only select up to 3 Case-Study questions for Section E');
          return prev;
        }
        
        // If we pass all the checks, add the question
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

  // Handle events for updating selected questions from QuestionSetBuilder
  useEffect(() => {
    const handleUpdateSelectedQuestions = (event: CustomEvent) => {
      if (event.detail && Array.isArray(event.detail)) {
        setSelectedQuestions(event.detail);
      }
    };
    
    window.addEventListener('update-selected-questions', handleUpdateSelectedQuestions as EventListener);
    
    return () => {
      window.removeEventListener('update-selected-questions', handleUpdateSelectedQuestions as EventListener);
    };
  }, []);

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
          {showQuestionSetBuilder && (
            <QuestionSetBuilder
              selectedQuestions={selectedQuestions}
              onClose={handleCloseQuestionSetBuilder}
              onSuccess={handleQuestionSetSuccess}
              onViewQuestion={handleViewQuestion}
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