import React, { useState, useEffect } from 'react';
import styles from './TeacherProfile.module.css';

interface QuestionSetResults {
  success: number;
  failed: number;
  unsure: number;
}

interface QuestionSetStats {
  _id: string;
  label?: string; 
  totalStudents: number;
  studentsCompleted: number;
  avgSuccessRate: number;
  avgCompletionTime: number; // in milliseconds
  avgResults: QuestionSetResults;
  questionCount: number;
  // Student success rate distribution
  successRateDistribution?: {
    excellent: number; // 90-100%
    good: number;      // 75-89%
    average: number;   // 60-74%
    belowAverage: number; // 40-59%
    poor: number;      // 0-39%
  };
}

interface QuestionSetPerformanceProps {
  roomId: string;
}

const QuestionSetPerformance: React.FC<QuestionSetPerformanceProps> = ({ roomId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questionSets, setQuestionSets] = useState<QuestionSetStats[]>([]);
  const [expandedSetId, setExpandedSetId] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestionSetPerformance = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/rooms/${roomId}/question-sets-performance`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch question set performance data');
        }
        
        const data = await response.json();
        setQuestionSets(data.questionSets);
      } catch (err) {
        console.error('Error fetching question set performance:', err);
        setError('Failed to load question set performance data.');
      } finally {
        setLoading(false);
      }
    };

    if (roomId) {
      fetchQuestionSetPerformance();
    }
  }, [roomId]);

  // Format duration from milliseconds to minutes:seconds
  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
  };

  const toggleExpand = (setId: string) => {
    if (expandedSetId === setId) {
      setExpandedSetId(null);
    } else {
      setExpandedSetId(setId);
    }
  };

  // Helper function to get percentage of students in each success rate category
  const getDistributionPercentage = (count: number, total: number): string => {
    if (total === 0) return '0%';
    return `${Math.round((count / total) * 100)}%`;
  };

  if (loading) {
    return <div className={styles.loading}>Loading question set performance data...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (questionSets.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No question sets have been completed by students yet.</p>
      </div>
    );
  }

  return (
    <div className={styles.questionSetPerformance}>
      <h2>Question Set Performance</h2>
      
      <div className={styles.questionSetList}>
        {questionSets.map(set => (
          <div 
            key={set._id} 
            className={`${styles.questionSetCard} ${expandedSetId === set._id ? styles.expanded : ''}`}
          >
            <div 
              className={styles.questionSetHeader}
              onClick={() => toggleExpand(set._id)}
            >
              <div>
                <h3>{set.label ? set.label : 'Untitled'}</h3>
                {set.label && <div className={styles.questionSetLabel}>{set.label}</div>}
              </div>
              <div className={styles.questionSetSummary}>
                <span>
                  {set.studentsCompleted}/{set.totalStudents} students completed
                </span>
                <span className={styles.expandIcon}>
                  {expandedSetId === set._id ? '▼' : '▶'}
                </span>
              </div>
            </div>
            
            {expandedSetId === set._id && (
              <div className={styles.questionSetDetails}>
                <div className={styles.statsGrid}>
                  <div className={styles.statItem}>
                    <div className={styles.statValue}>{set.avgSuccessRate.toFixed(1)}%</div>
                    <div className={styles.statLabel}>Avg. Success Rate</div>
                  </div>
                  <div className={styles.statItem}>
                    <div className={styles.statValue}>{formatDuration(set.avgCompletionTime)}</div>
                    <div className={styles.statLabel}>Avg. Completion Time</div>
                  </div>
                  <div className={styles.statItem}>
                    <div className={styles.statValue}>
                      {((set.studentsCompleted / set.totalStudents) * 100).toFixed(1)}%
                    </div>
                    <div className={styles.statLabel}>Completion Rate</div>
                  </div>
                </div>
                
                {/* Student Success Rate Distribution */}
                {set.successRateDistribution && (
                  <div className={styles.distributionSection}>
                    <h4>Student Success Rate Distribution</h4>
                    <div className={styles.distributionBar}>
                      <div 
                        className={styles.excellentBar}
                        style={{ 
                          width: `${(set.successRateDistribution.excellent / set.studentsCompleted) * 100}%` 
                        }}
                        title={`Excellent (90-100%): ${set.successRateDistribution.excellent} students`}
                      />
                      <div 
                        className={styles.goodBar}
                        style={{ 
                          width: `${(set.successRateDistribution.good / set.studentsCompleted) * 100}%` 
                        }}
                        title={`Good (75-89%): ${set.successRateDistribution.good} students`}
                      />
                      <div 
                        className={styles.averageBar}
                        style={{ 
                          width: `${(set.successRateDistribution.average / set.studentsCompleted) * 100}%` 
                        }}
                        title={`Average (60-74%): ${set.successRateDistribution.average} students`}
                      />
                      <div 
                        className={styles.belowAverageBar}
                        style={{ 
                          width: `${(set.successRateDistribution.belowAverage / set.studentsCompleted) * 100}%` 
                        }}
                        title={`Below Average (40-59%): ${set.successRateDistribution.belowAverage} students`}
                      />
                      <div 
                        className={styles.poorBar}
                        style={{ 
                          width: `${(set.successRateDistribution.poor / set.studentsCompleted) * 100}%` 
                        }}
                        title={`Poor (0-39%): ${set.successRateDistribution.poor} students`}
                      />
                    </div>
                    <div className={styles.distributionLegend}>
                      <div className={styles.legendItem}>
                        <span className={styles.excellentDot}></span>
                        <span>Excellent: {getDistributionPercentage(set.successRateDistribution.excellent, set.studentsCompleted)}</span>
                      </div>
                      <div className={styles.legendItem}>
                        <span className={styles.goodDot}></span>
                        <span>Good: {getDistributionPercentage(set.successRateDistribution.good, set.studentsCompleted)}</span>
                      </div>
                      <div className={styles.legendItem}>
                        <span className={styles.averageDot}></span>
                        <span>Average: {getDistributionPercentage(set.successRateDistribution.average, set.studentsCompleted)}</span>
                      </div>
                      <div className={styles.legendItem}>
                        <span className={styles.belowAverageDot}></span>
                        <span>Below Avg: {getDistributionPercentage(set.successRateDistribution.belowAverage, set.studentsCompleted)}</span>
                      </div>
                      <div className={styles.legendItem}>
                        <span className={styles.poorDot}></span>
                        <span>Poor: {getDistributionPercentage(set.successRateDistribution.poor, set.studentsCompleted)}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className={styles.resultsBreakdown}>
                  <h4>Results Breakdown</h4>
                  <div className={styles.progressContainer}>
                    <div className={styles.progressLabel}>
                      <span>Success: {set.avgResults.success.toFixed(1)}</span>
                      <span>Unsure: {set.avgResults.unsure.toFixed(1)}</span>
                      <span>Failed: {set.avgResults.failed.toFixed(1)}</span>
                    </div>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressSuccess}
                        style={{ 
                          width: `${(set.avgResults.success / set.questionCount) * 100}%` 
                        }}
                      />
                      <div 
                        className={styles.progressUnsure}
                        style={{ 
                          width: `${(set.avgResults.unsure / set.questionCount) * 100}%` 
                        }}
                      />
                      <div 
                        className={styles.progressFailed}
                        style={{ 
                          width: `${(set.avgResults.failed / set.questionCount) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestionSetPerformance;
