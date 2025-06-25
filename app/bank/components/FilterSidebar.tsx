import { FilterOption, FilterState } from '../../../models/Question';
import MultiSelect from '../../components/MultiSelect';
import Dropdown from '../../components/Dropdown';
import styles from './FilterSidebar.module.css';

interface FilterSidebarProps {
  filterOptions: Record<string, FilterOption>;
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
}

export default function FilterSidebar({
  filterOptions,
  filters,
  onFilterChange
}: FilterSidebarProps) {
  const handleTopicsChange = (selected: string[]) => {
    onFilterChange({ topic: selected });
  };

  const handleDifficultiesChange = (selected: string[]) => {
    onFilterChange({ difficulty_level: selected });
  };

  const handleEducationBoardChange = (value: string) => {
    onFilterChange({ education_board: value });
  };

  const handleClassChange = (value: string) => {
    onFilterChange({ class: value });
  };

  const handleSubjectChange = (value: string) => {
    onFilterChange({ subject: value });
  };

  const handleInCourseChange = (selected: string[]) => {
    onFilterChange({ inCourse: selected });
  };

  const handleHOTSChange = (selected: string[]) => {
    onFilterChange({ isHOTS: selected });
  };

  const handleCorrectChange = (selected: string[]) => {
    onFilterChange({ isCorrect: selected });
  };

  const handleQuestionTypeChange = (selected: string[]) => {
    onFilterChange({ q_type: selected });
  };

  return (
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
  );
}