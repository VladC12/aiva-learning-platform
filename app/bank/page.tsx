"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { useUser } from 'context/UserContext';
import MultiSelect from '../components/MultiSelect';
import Dropdown from '../components/Dropdown';
import QuestionModal from '../components/QuestionModal';
import StatusToggle from '../components/StatusToggle';

interface Question {
  _id: string;
  subject: string;
  topic: string;
  question: string;
  solution: string;
  difficulty_level: string;
  class: string;
  question_pdf_blob?: string;
  solution_pdf_blob?: string;
  label?: string;
  inCourse?: boolean;
  isHOTS?: boolean;
  isCorrect?: boolean;
  q_type?: string; // Added question type field
  // Moderator fields
  modDifficulty_level?: string;
  modInCourse?: boolean;
  modIsHOTS?: boolean;
  modIsCorrect?: boolean;
  modQ_type?: string;
}

interface FilterOption {
  _id: string;
  content: string[];
  label: string;
  key: string;
}

interface FilterState {
  education_board: string;
  class: string;
  subject: string;
  topic: string[];
  difficulty_level: string[];
  inCourse: string[]; // Changed to array for MultiSelect
  isHOTS: string[];
  isCorrect: string[];
  q_type: string[]; // Added question type filter
}

export default function Bank() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [filterOptions, setFilterOptions] = useState<Record<string, FilterOption>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [questions, setQuestions] = useState<Question[]>([]);
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

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Redirect non-reviewer/non-moderator users
  useEffect(() => {
    if (!userLoading && user && user.type !== 'reviewer' && user.type !== 'moderator') {
      router.push('/');
    }
  }, [user, userLoading, router]);

  // Fetch filter options
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/filters');
        if (!response.ok) {
          throw new Error('Failed to fetch filters');
        }
        const data = await response.json();

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

    fetchFilters();
  }, []);

  // Fetch questions based on filters and pagination
  useEffect(() => {
    const fetchQuestions = async () => {
      if (userLoading) return;

      try {
        setIsLoading(true);

        // Create request body for POST request
        const requestBody = {
          education_board: filters.education_board || '',
          class: filters.class || '',
          subject: filters.subject || '',
          topic: filters.topic.join(','),
          difficulty_level: filters.difficulty_level.join(','),
          amount: pagination.limit,
          page: pagination.page,
          inCourse: filters.inCourse.join(','),
          isHOTS: filters.isHOTS.join(','),
          isCorrect: filters.isCorrect.join(','),
          q_type: filters.q_type.join(','),
          // For moderators, only show questions that are marked as in course and correct
          moderatorView: user?.type === 'moderator'
        };

        console.log(`Fetching page ${pagination.page} with limit ${pagination.limit}`);

        const response = await fetch('/api/questions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch questions');
        }

        const questions = await response.json();
        setQuestions(questions);
        console.log(`Loaded ${questions.length} questions for page ${pagination.page}`);
      } catch (error) {
        console.error("Error fetching questions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!userLoading && user && (user.type === 'reviewer' || user.type === 'moderator')) {
      fetchQuestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.page, pagination.limit, user, userLoading]);

  // Separate effect for fetching the count of questions based on filters
  useEffect(() => {
    const fetchCount = async () => {
      if (userLoading || !user) return;

      try {
        // Create request body for count POST request
        const countRequestBody = {
          education_board: filters.education_board || '',
          class: filters.class || '',
          subject: filters.subject || '',
          topic: filters.topic.join(','),
          difficulty_level: filters.difficulty_level.join(','),
          inCourse: filters.inCourse.join(','),
          isHOTS: filters.isHOTS.join(','),
          isCorrect: filters.isCorrect.join(','),
          q_type: filters.q_type.join(','),
          moderatorView: user?.type === 'moderator'
        };

        console.log('Fetching count with filters:', countRequestBody);

        const countResponse = await fetch('/api/questions/count', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(countRequestBody),
        });

        if (countResponse.ok) {
          const countData = await countResponse.json();
          setPagination(prev => ({
            ...prev,
            total: countData.count,
            totalPages: Math.ceil(countData.count / prev.limit)
          }));
          console.log(`Total questions: ${countData.count}, Pages: ${Math.ceil(countData.count / pagination.limit)}`);
        } else {
          console.error('Failed to fetch question count');
        }
      } catch (error) {
        console.error("Error fetching question count:", error);
      }
    };

    if (user?.type === 'reviewer' || user?.type === 'moderator') {
      fetchCount();
    }
  }, [filters, pagination.limit, user, userLoading]);

  const handleTopicsChange = (selected: string[]) => {
    setFilters(prev => ({
      ...prev,
      topic: selected
    }));
    // Reset to first page when filter changes
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  };

  const handleDifficultiesChange = (selected: string[]) => {
    setFilters(prev => ({
      ...prev,
      difficulty_level: selected
    }));
    // Reset to first page when filter changes
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  };

  const handleEducationBoardChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      education_board: value
    }));
    // Reset to first page when filter changes
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  };

  const handleClassChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      class: value
    }));
    // Reset to first page when filter changes
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  };

  const handleSubjectChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      subject: value
    }));
    // Reset to first page when filter changes
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  };

  const handleLimitChange = (value: string) => {
    const newLimit = parseInt(value, 10);
    setPagination(prev => ({
      ...prev,
      limit: newLimit,
      page: 1
      // We'll let the useEffect calculate totalPages based on the new count
    }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const handleInCourseChange = (selected: string[]) => {
    console.log('Setting inCourse filter to:', selected);
    setFilters(prev => ({
      ...prev,
      inCourse: selected
    }));
    // Reset to first page when filter changes
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  };

  const handleHOTSChange = (selected: string[]) => {
    console.log('Setting isHOTS filter to:', selected);
    setFilters(prev => ({
      ...prev,
      isHOTS: selected
    }));
    // Reset to first page when filter changes
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  };

  const handleCorrectChange = (selected: string[]) => {
    console.log('Setting isCorrect filter to:', selected);
    setFilters(prev => ({
      ...prev,
      isCorrect: selected
    }));
    // Reset to first page when filter changes
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  };

  const handleQuestionTypeChange = (selected: string[]) => {
    console.log('Setting q_type filter to:', selected);
    setFilters(prev => ({
      ...prev,
      q_type: selected
    }));
    // Reset to first page when filter changes
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  };

  const handleToggleInCourse = async (questionId: string, newValue: boolean) => {
    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inCourse: newValue }),
      });

      if (response.ok) {
        // Update local state
        setQuestions(questions.map(q =>
          q._id === questionId ? { ...q, inCourse: newValue } : q
        ));
      } else {
        console.error('Failed to update question');
      }
    } catch (error) {
      console.error('Error updating question:', error);
    }
  };

  const handleChangeDifficulty = async (questionId: string, newDifficulty: string) => {
    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ difficulty_level: newDifficulty }),
      });

      if (response.ok) {
        // Update local state
        setQuestions(questions.map(q =>
          q._id === questionId ? { ...q, difficulty_level: newDifficulty } : q
        ));
      } else {
        console.error('Failed to update question difficulty');
      }
    } catch (error) {
      console.error('Error updating question difficulty:', error);
    }
  };

  const handleToggleHOTS = async (questionId: string, newValue: boolean) => {
    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isHOTS: newValue }),
      });

      if (response.ok) {
        // Update local state
        setQuestions(questions.map(q =>
          q._id === questionId ? { ...q, isHOTS: newValue } : q
        ));
      } else {
        console.error('Failed to update question HOTS status');
      }
    } catch (error) {
      console.error('Error updating question HOTS status:', error);
    }
  };

  const handleToggleCorrect = async (questionId: string, newValue: boolean) => {
    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isCorrect: newValue }),
      });

      if (response.ok) {
        // Update local state
        setQuestions(questions.map(q =>
          q._id === questionId ? { ...q, isCorrect: newValue } : q
        ));
      } else {
        console.error('Failed to update question correctness status');
      }
    } catch (error) {
      console.error('Error updating question correctness status:', error);
    }
  };

  const handleChangeQuestionType = async (questionId: string, newType: string) => {
    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q_type: newType }),
      });

      if (response.ok) {
        // Update local state
        setQuestions(questions.map(q =>
          q._id === questionId ? { ...q, q_type: newType } : q
        ));
      } else {
        console.error('Failed to update question type');
      }
    } catch (error) {
      console.error('Error updating question type:', error);
    }
  };

  const handleModeratorChangeDifficulty = async (questionId: string, newDifficulty: string) => {
    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ modDifficulty_level: newDifficulty }),
      });

      if (response.ok) {
        // Update local state
        setQuestions(questions.map(q =>
          q._id === questionId ? { ...q, modDifficulty_level: newDifficulty } : q
        ));
      } else {
        console.error('Failed to update moderator question difficulty');
      }
    } catch (error) {
      console.error('Error updating moderator question difficulty:', error);
    }
  };

  const handleModeratorToggleInCourse = async (questionId: string, newValue: boolean) => {
    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ modInCourse: newValue }),
      });

      if (response.ok) {
        // Update local state
        setQuestions(questions.map(q =>
          q._id === questionId ? { ...q, modInCourse: newValue } : q
        ));
      } else {
        console.error('Failed to update moderator question in course status');
      }
    } catch (error) {
      console.error('Error updating moderator question in course status:', error);
    }
  };

  const handleModeratorToggleHOTS = async (questionId: string, newValue: boolean) => {
    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ modIsHOTS: newValue }),
      });

      if (response.ok) {
        // Update local state
        setQuestions(questions.map(q =>
          q._id === questionId ? { ...q, modIsHOTS: newValue } : q
        ));
      } else {
        console.error('Failed to update moderator question HOTS status');
      }
    } catch (error) {
      console.error('Error updating moderator question HOTS status:', error);
    }
  };

  const handleModeratorToggleCorrect = async (questionId: string, newValue: boolean) => {
    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ modIsCorrect: newValue }),
      });

      if (response.ok) {
        // Update local state
        setQuestions(questions.map(q =>
          q._id === questionId ? { ...q, modIsCorrect: newValue } : q
        ));
      } else {
        console.error('Failed to update moderator question correctness status');
      }
    } catch (error) {
      console.error('Error updating moderator question correctness status:', error);
    }
  };

  const handleModeratorChangeQuestionType = async (questionId: string, newType: string) => {
    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ modQ_type: newType }),
      });

      if (response.ok) {
        // Update local state
        setQuestions(questions.map(q =>
          q._id === questionId ? { ...q, modQ_type: newType } : q
        ));
      } else {
        console.error('Failed to update moderator question type');
      }
    } catch (error) {
      console.error('Error updating moderator question type:', error);
    }
  };

  const handleViewQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedQuestion(null);
  };

  // If loading or not a reviewer/moderator, show loading
  if (userLoading || (user && user.type !== 'reviewer' && user.type !== 'moderator')) {
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

        <div className={styles.contentGrid}>
          {/* Filters sidebar */}
          <div className={styles.sidebar}>
            <div className={styles.filterSection}>
              <h2>Filters</h2>

              <div className={styles.filterItem}>
                <Dropdown
                  label={filterOptions.education_board?.label || "Education Board"}
                  value={filters.education_board}
                  onChange={handleEducationBoardChange}
                  options={filterOptions.education_board?.content.map(item => ({
                    value: item,
                    label: item
                  })) || []}
                  placeholder="Select Education Board"
                />
              </div>

              <div className={styles.filterItem}>
                <Dropdown
                  label={filterOptions.class?.label || "Class"}
                  value={filters.class}
                  onChange={handleClassChange}
                  options={filterOptions.class?.content.map(item => ({
                    value: item,
                    label: item
                  })) || []}
                  placeholder="Select Class"
                />
              </div>

              <div className={styles.filterItem}>
                <Dropdown
                  label={filterOptions.subject?.label || "Subject"}
                  value={filters.subject}
                  onChange={handleSubjectChange}
                  options={filterOptions.subject?.content.map(item => ({
                    value: item,
                    label: item
                  })) || []}
                  placeholder="Select Subject"
                />
              </div>

              <div className={styles.filterItem}>
                <label htmlFor="topics">{filterOptions.topic?.label || "Topics"}</label>
                <MultiSelect
                  options={filterOptions.topic?.content || []}
                  value={filters.topic}
                  onChange={handleTopicsChange}
                  placeholder="Select topics"
                />
              </div>
              <div className={styles.filterItem}>
                <label htmlFor="q_type">{filterOptions.q_type?.label || "Question Type"}</label>
                <MultiSelect
                  options={filterOptions.q_type?.content || []}
                  value={filters.q_type}
                  onChange={handleQuestionTypeChange}
                  placeholder="Select question types"
                />
              </div>
              <div className={styles.filterItem}>
                <label htmlFor="difficulties">{filterOptions.difficulty_level?.label || "Difficulty"}</label>
                <MultiSelect
                  options={filterOptions.difficulty_level?.content || []}
                  value={filters.difficulty_level}
                  onChange={handleDifficultiesChange}
                  placeholder="Select difficulty levels"
                />
              </div>

              <div className={styles.filterItem}>
                <label htmlFor="inCourse">In Course</label>
                <MultiSelect
                  options={['Yes', 'No', 'Unmarked']}
                  value={filters.inCourse}
                  onChange={handleInCourseChange}
                  placeholder="Filter by course status"
                />
              </div>

              <div className={styles.filterItem}>
                <label htmlFor="isHOTS">Higher Order Thinking Skills</label>
                <MultiSelect
                  options={['Yes', 'No', 'Unmarked']}
                  value={filters.isHOTS}
                  onChange={handleHOTSChange}
                  placeholder="Filter by HOTS status"
                />
              </div>

              <div className={styles.filterItem}>
                <label htmlFor="isCorrect">Correct</label>
                <MultiSelect
                  options={['Yes', 'No', 'Unmarked']}
                  value={filters.isCorrect}
                  onChange={handleCorrectChange}
                  placeholder="Filter by correctness"
                />
              </div>
            </div>
          </div>

          {/* Questions content */}
          <div className={styles.content}>
            {isLoading ? (
              <div className={styles.loading}>Loading questions...</div>
            ) : (
              <>
                <div className={styles.questionControls}>
                  <div className={styles.questionCount}>
                    {pagination.total} Questions Found
                  </div>
                  <div className={styles.limitSelector}>
                    <label htmlFor="limit">Show:</label>
                    <select
                      id="limit"
                      value={pagination.limit.toString()}
                      onChange={(e) => handleLimitChange(e.target.value)}
                    >
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                    </select>
                  </div>
                </div>

                {questions.length > 0 ? (
                  <>
                    <div className={styles.questionList}>
                      <div className={styles.questionHeader}>
                        <div className={styles.questionTopic}>Topic</div>
                        <div className={styles.questionContent}>Question</div>
                        <div className={styles.questionDifficulty}>Difficulty</div>
                        <div className={styles.questionClass}>Class</div>
                        <div className={styles.questionInCourse}>In Course</div>
                        <div className={styles.questionHOTS}>HOTS</div>
                        <div className={styles.questionCorrect}>Correct</div>
                        <div className={styles.questionType}>Type</div>
                      </div>

                      {questions.map((question) => (
                        <div key={question._id} className={styles.questionItem}>
                          <div className={styles.questionTopic}>{question.topic}</div>
                          <div className={styles.questionContent}>
                            <button
                              className={styles.viewQuestionButton}
                              onClick={() => handleViewQuestion(question)}
                            >
                              View Question
                            </button>
                          </div>
                          <div className={styles.questionDifficulty}>
                            {user?.type === 'moderator' ? (
                              <select
                                value={question.modDifficulty_level !== undefined ? question.modDifficulty_level : question.difficulty_level}
                                onChange={(e) => handleModeratorChangeDifficulty(question._id, e.target.value)}
                                className={styles.difficultySelect}
                              >
                                {filterOptions.difficulty_level?.content.map(level => (
                                  <option key={level} value={level}>{level}</option>
                                ))}
                              </select>
                            ) : (
                              <select
                                value={question.difficulty_level}
                                onChange={(e) => handleChangeDifficulty(question._id, e.target.value)}
                                className={styles.difficultySelect}
                              >
                                {filterOptions.difficulty_level?.content.map(level => (
                                  <option key={level} value={level}>{level}</option>
                                ))}
                              </select>
                            )}
                          </div>
                          <div className={styles.questionClass}>{question.class}</div>
                          <div className={styles.questionInCourse}>
                            {user?.type === 'moderator' ? (
                              <StatusToggle
                                value={question.modInCourse !== undefined ? question.modInCourse : question.inCourse}
                                onToggle={(newValue) => handleModeratorToggleInCourse(question._id, newValue)}
                                trueLabel="Yes"
                                falseLabel="No"
                                unmarkedLabel="Unmarked"
                              />
                            ) : (
                              <StatusToggle
                                value={question.inCourse}
                                onToggle={(newValue) => handleToggleInCourse(question._id, newValue)}
                                trueLabel="Yes"
                                falseLabel="No"
                                unmarkedLabel="Unmarked"
                              />
                            )}
                          </div>
                          <div className={styles.questionHOTS}>
                            {user?.type === 'moderator' ? (
                              <StatusToggle
                                value={question.modIsHOTS !== undefined ? question.modIsHOTS : question.isHOTS}
                                onToggle={(newValue) => handleModeratorToggleHOTS(question._id, newValue)}
                                trueLabel="Yes"
                                falseLabel="No"
                                unmarkedLabel="Unmarked"
                              />
                            ) : (
                              <StatusToggle
                                value={question.isHOTS}
                                onToggle={(newValue) => handleToggleHOTS(question._id, newValue)}
                                trueLabel="Yes"
                                falseLabel="No"
                                unmarkedLabel="Unmarked"
                              />
                            )}
                          </div>
                          <div className={styles.questionCorrect}>
                            {user?.type === 'moderator' ? (
                              <StatusToggle
                                value={question.modIsCorrect !== undefined ? question.modIsCorrect : question.isCorrect}
                                onToggle={(newValue) => handleModeratorToggleCorrect(question._id, newValue)}
                                trueLabel="Yes"
                                falseLabel="No"
                                unmarkedLabel="Unmarked"
                              />
                            ) : (
                              <StatusToggle
                                value={question.isCorrect}
                                onToggle={(newValue) => handleToggleCorrect(question._id, newValue)}
                                trueLabel="Yes"
                                falseLabel="No"
                                unmarkedLabel="Unmarked"
                              />
                            )}
                          </div>
                          <div className={styles.questionType}>
                            {user?.type === 'moderator' ? (
                              <select
                                value={question.modQ_type !== undefined ? question.modQ_type : question.q_type || ''}
                                onChange={(e) => handleModeratorChangeQuestionType(question._id, e.target.value)}
                                className={styles.typeSelect}
                              >
                                <option value="">Select Type</option>
                                {filterOptions.q_type?.content.map(type => (
                                  <option key={type} value={type}>{type}</option>
                                ))}
                              </select>
                            ) : (
                              <select
                                value={question.q_type || ''}
                                onChange={(e) => handleChangeQuestionType(question._id, e.target.value)}
                                className={styles.typeSelect}
                              >
                                <option value="">Select Type</option>
                                {filterOptions.q_type?.content.map(type => (
                                  <option key={type} value={type}>{type}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        </div>
                      ))}
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
                    <p>No questions found matching the current filters.</p>
                    <p>Try adjusting your filter criteria.</p>
                  </div>
                )}
              </>
            )}
          </div>
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