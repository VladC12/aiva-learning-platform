"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import MultiSelect from './components/MultiSelect';
import Dropdown from './components/Dropdown';
import QuestionList from './components/QuestionList';

interface FilterState {
    curriculum: string;
    class: string;
    subject: string;
    topics: string[];
    difficulties: string[];
}

const subjectTopicsMap: { [key: string]: string[] } = {
    Mathematics: ['Algebra', 'Geometry', 'Calculus', 'Statistics', 'Trigonometry'],
    Physics: ['Mechanics', 'Thermodynamics', 'Optics', 'Electricity', 'Modern Physics'],
    Chemistry: ['Organic', 'Inorganic', 'Physical', 'Analytical', 'Biochemistry'],
    Biology: ['Botany', 'Zoology', 'Genetics', 'Ecology', 'Physiology']
};

const difficultyLevels = ['Easy', 'Medium', 'Hard'];


export default function Home() {
    const router = useRouter();
    const [filters, setFilters] = useState<FilterState>({
        curriculum: '',
        class: '',
        subject: '',
        topics: [],
        difficulties: difficultyLevels // Default to all difficulties
    });

    useEffect(() => { }, [])

    const handleTopicsChange = (selected: string[]) => {
        setFilters(prev => ({
            ...prev,
            topics: selected
        }));
    };

    const handleDifficultiesChange = (selected: string[]) => {
        setFilters(prev => ({
            ...prev,
            difficulties: selected
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams({
            ...filters,
            topics: filters.topics.join(','),
            difficulties: filters.difficulties.join(',')
        });
        router.push(`/questions?${params.toString()}`);
    };

    return (
        <main className={styles.main}>
            <h1>Question Bank</h1>
            <form onSubmit={handleSubmit} className={styles.filterForm}>
                <div className={styles.filterGrid}>
                    <div className={styles.filterItem}>
                        <Dropdown
                            label="Education Board"
                            value={filters.curriculum}
                            onChange={(value) => setFilters(prev => ({ ...prev, curriculum: value }))}
                            options={[
                                { value: "CBSE", label: "CBSE" }
                            ]}
                            placeholder="Select Curriculum"
                        />
                    </div>
                    <div className={styles.filterItem}>
                        <Dropdown
                            label="Class"
                            value={filters.curriculum}
                            onChange={(value) => setFilters(prev => ({ ...prev, curriculum: value }))}
                            options={[
                                { value: "XII", label: "XII" }
                            ]}
                            placeholder="Select Class"
                        />
                    </div>
                    <div className={styles.filterItem}>
                        <Dropdown
                            label="Subject"
                            value={filters.subject}
                            onChange={(value) => {
                                setFilters(prev => ({
                                    ...prev,
                                    subject: value,
                                    topics: []
                                }));
                            }}
                            options={Object.keys(subjectTopicsMap).map(subject => ({
                                value: subject,
                                label: subject
                            }))}
                            placeholder="Select Subject"
                        />
                    </div>

                    <div className={styles.filterItem}>
                        <label htmlFor="topics">Topics</label>
                        <MultiSelect
                            options={filters.subject ? subjectTopicsMap[filters.subject] : []}
                            value={filters.topics}
                            onChange={handleTopicsChange}
                            placeholder="Select topics"
                        />
                    </div>

                    <div className={styles.filterItem}>
                        <label htmlFor="difficulties">Difficulty</label>
                        <MultiSelect
                            options={difficultyLevels}
                            value={filters.difficulties}
                            onChange={handleDifficultiesChange}
                            placeholder="Select difficulty levels"
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
