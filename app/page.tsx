"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import MultiSelect from './components/MultiSelect';
import Dropdown from './components/Dropdown';
import QuestionList from './components/QuestionList';
import { useUser } from 'context/UserContext';

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
  q_type: string[]; // Added question type filter
}

export default function Home() {
  const router = useRouter();
  const { loading: userLoading } = useUser(); // Get user and loading state from context
  const [filterOptions, setFilterOptions] = useState<Record<string, FilterOption>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const [filters, setFilters] = useState<FilterState>({
    education_board: '',
    class: '',
    subject: '',
    topic: [],
    difficulty_level: [],
    q_type: []
  });

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

  const handleTopicsChange = (selected: string[]) => {
    setFilters(prev => ({
      ...prev,
      topic: selected
    }));
  };

  const handleDifficultiesChange = (selected: string[]) => {
    setFilters(prev => ({
      ...prev,
      difficulty_level: selected
    }));
  };

  const handleQuestionTypeChange = (selected: string[]) => {
    setFilters(prev => ({
      ...prev,
      q_type: selected
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({
      education_board: filters.education_board,
      class: filters.class,
      subject: filters.subject,
      topic: filters.topic.join(','),
      difficulty_level: filters.difficulty_level.join(','),
      q_type: filters.q_type.join(',')
    });
    router.push(`/questions?${params.toString()}`);
  };

  // Modified loading state to account for user loading
  if (userLoading || isLoading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <main className={styles.main}>
      <h1>Question Generator</h1>
      <form onSubmit={handleSubmit} className={styles.filterForm}>
        <div className={styles.filterGrid}>
          <div className={styles.filterItem}>
            <Dropdown
              label={filterOptions.education_board?.label || "Education Board"}
              value={filters.education_board}
              // onChange={(value) => setFilters(prev => ({ ...prev, education_board: value }))}
              onChange={(_value) => setFilters(prev => prev)}
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
              onChange={(_value) => setFilters(prev => prev)}
              // onChange={(value) => setFilters(prev => ({ ...prev, class: value }))}
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
              // onChange={(value) => {
              //   setFilters(prev => ({
              //     ...prev,
              //     subject: value
              //   }));
              // }}
              onChange={(_value) => setFilters(prev => prev)}
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
            <label htmlFor="difficulties">{filterOptions.difficulty_level?.label || "Difficulty"}</label>
            <MultiSelect
              options={filterOptions.difficulty_level?.content || []}
              value={filters.difficulty_level}
              onChange={handleDifficultiesChange}
              placeholder="Select difficulty levels"
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
        </div>

        <button type="submit" className={styles.generateButton}>
          Generate Questions
        </button>
      </form>
      <QuestionList />
    </main>
  );
}
