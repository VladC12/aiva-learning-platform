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
  parent?: string; // Add parent field to track which education board this filter belongs to
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
  const { user, loading: userLoading } = useUser(); // Get user and loading state from context
  const [filterOptions, setFilterOptions] = useState<Record<string, FilterOption>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // Track all available filters separately to keep original data
  const [allFilters, setAllFilters] = useState<FilterOption[]>([]);
  
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
        
        // Set default values for filter
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

    fetchFilters();
  }, [user]);

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

  const handleEducationBoardChange = (selectedBoard: string) => {
    // Update the education_board filter
    setFilters(prev => ({
      ...prev,
      education_board: selectedBoard,
      // Reset child filters when education board changes
      class: '',
      subject: '',
      topic: [],
      q_type: []
    }));

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
  };

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
              onChange={(value) => setFilters(prev => ({ ...prev, class: value }))}
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
              onChange={(value) => {
                setFilters(prev => ({
                  ...prev,
                  subject: value
                }));
              }}
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
      
      {/* Display two question lists: global and room-specific */}
      <div className={styles.questionListsContainer}>
        {/* Global question sets (not filtered by room) */}
        <QuestionList 
          title="Global Question Sets" 
          filterByRoom={false} 
        />
        
        {/* Room-specific question sets (only if user has a room) */}
        {user?.room && (
          <QuestionList 
            roomId={user.room} 
            filterByRoom={true} 
            title={user.type === 'teacher' ? "My Room Question Sets" : "Class Question Sets"}
          />
        )}
      </div>
    </main>
  );
}
