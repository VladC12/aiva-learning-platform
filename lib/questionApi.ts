import { ObjectId } from 'mongodb';
import { FilterState } from '../models/Question';

export const fetchFilters = async () => {
  const response = await fetch('/api/filters');
  if (!response.ok) {
    throw new Error('Failed to fetch filters');
  }
  return await response.json();
};

export const fetchQuestions = async (
  filters: FilterState,
  pagination: { page: number; limit: number },
  isModerator: boolean
) => {
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
    q_number: filters.q_number || '', // Ensure q_number is included
    // For moderators, only show questions that are marked as in course and correct
    moderatorView: isModerator
  };

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

  return await response.json();
};

export const fetchQuestionCount = async (
  filters: FilterState,
  isModerator: boolean
) => {
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
    moderatorView: isModerator
  };

  const countResponse = await fetch('/api/questions/count', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(countRequestBody),
  });

  if (!countResponse.ok) {
    throw new Error('Failed to fetch question count');
  }

  return await countResponse.json();
};

export const updateQuestion = async (
  questionId: string | ObjectId,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updates: Record<string, any>
) => {
  console.log(`Updating question ${questionId} with:`, updates);
  
  const response = await fetch(`/api/questions/${questionId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Update failed with response:', errorText);
    throw new Error(`Failed to update question: ${errorText}`);
  }

  return await response.json();
};