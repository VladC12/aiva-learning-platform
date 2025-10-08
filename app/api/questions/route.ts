import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Question, QuestionQuery } from '@/models/Question';
import { ObjectId } from 'mongodb';

/**
 * Balances questions by difficulty level and topics
 * @param questions All questions matching the base criteria
 * @param limit Number of questions to return
 * @param hasDifficultyFilter Whether a specific difficulty filter was applied
 * @param selectedTopics Array of selected topics (if any)
 * @returns Balanced set of questions
 */
async function balanceQuestions(
  questions: Question[],
  limit: number,
  hasDifficultyFilter: boolean,
  selectedTopics: string[] | null
): Promise<Question[]> {
  // If we have fewer questions than the limit, return all of them
  if (questions.length <= limit) {
    return questions;
  }

  // Create a balanced set based on difficulty if no specific difficulty was requested
  if (!hasDifficultyFilter) {
    // Group questions by difficulty
    const easyQuestions = questions.filter(q => q.difficulty_level?.toLowerCase() === 'easy');
    const mediumQuestions = questions.filter(q => q.difficulty_level?.toLowerCase() === 'medium');
    const hardQuestions = questions.filter(q => q.difficulty_level?.toLowerCase() === 'hard');
    
    // Ensure we have at least one hard question if available
    const minHardCount = hardQuestions.length > 0 ? 1 : 0;
    
    // Calculate how many of each difficulty we need
    let hardCount = Math.max(minHardCount, Math.round(limit * 0.2));  // At least 1 hard question if available
    const easyCount = Math.round(limit * 0.3);  // 30% easy
    
    // Adjust counts if we don't have enough questions
    if (hardCount > hardQuestions.length) {
      hardCount = hardQuestions.length;
    }
    
    // Medium gets the remainder, but ensure we don't go over the limit
    const mediumCount = limit - easyCount - hardCount;
    
    // Random selection function
    const getRandomSubset = (arr: Question[], count: number) => {
      return arr.sort(() => 0.5 - Math.random()).slice(0, count);
    };
    
    // Get our balanced selection
    let balancedQuestions: Question[] = [
      ...getRandomSubset(easyQuestions, Math.min(easyCount, easyQuestions.length)),
      ...getRandomSubset(mediumQuestions, Math.min(mediumCount, mediumQuestions.length)),
      ...getRandomSubset(hardQuestions, Math.min(hardCount, hardQuestions.length))
    ];
    
    // If we don't have enough questions in one category, redistribute
    const remaining = limit - balancedQuestions.length;
    if (remaining > 0) {
      // Combine all questions and remove the ones we've already selected
      const remainingQuestions = questions.filter(q => 
        !balancedQuestions.some(bq => bq._id.toString() === q._id.toString())
      );
      
      // Add random questions to fill the gap
      balancedQuestions = [
        ...balancedQuestions,
        ...getRandomSubset(remainingQuestions, remaining)
      ];
    }
    
    questions = balancedQuestions;
  }

  // Balance topics if multiple topics were selected
  if (selectedTopics && selectedTopics.length > 1) {
    // Group questions by topic
    const questionsByTopic: Record<string, Question[]> = {};
    
    // Some questions may have multiple topics, so we need to handle that
    questions.forEach(question => {
      const questionTopics = Array.isArray(question.topic) ? question.topic : [question.topic];
      
      // Only consider topics that were in the original selection
      const relevantTopics = questionTopics.filter(topic => 
        selectedTopics.includes(topic)
      );
      
      // If no relevant topics, skip this question
      if (relevantTopics.length === 0) return;
      
      // Randomly assign the question to one of its topics for balancing
      const randomTopic = relevantTopics[Math.floor(Math.random() * relevantTopics.length)];
      
      if (!questionsByTopic[randomTopic]) {
        questionsByTopic[randomTopic] = [];
      }
      questionsByTopic[randomTopic].push(question);
    });
    
    // Calculate how many questions per topic we should include
    const topicsWithQuestions = Object.keys(questionsByTopic);
    const questionsPerTopic = Math.floor(limit / topicsWithQuestions.length);
    let remainder = limit % topicsWithQuestions.length;
    
    // Get balanced questions by topic
    let balancedByTopic: Question[] = [];
    
    topicsWithQuestions.forEach(topic => {
      const topicQuestions = questionsByTopic[topic];
      // Take questionsPerTopic + 1 extra if we have remainder
      const takeCount = questionsPerTopic + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder--;
      
      // Get random subset for this topic
      const selected = topicQuestions
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.min(takeCount, topicQuestions.length));
        
      balancedByTopic = [...balancedByTopic, ...selected];
    });
    
    // If we still don't have enough questions, add random ones to fill the gap
    if (balancedByTopic.length < limit) {
      const remaining = limit - balancedByTopic.length;
      const remainingQuestions = questions.filter(q => 
        !balancedByTopic.some(bq => bq._id.toString() === q._id.toString())
      );
      
      const additionalQuestions = remainingQuestions
        .sort(() => 0.5 - Math.random())
        .slice(0, remaining);
        
      balancedByTopic = [...balancedByTopic, ...additionalQuestions];
    }
    
    // If we ended up with too many questions (unlikely), trim the excess
    if (balancedByTopic.length > limit) {
      balancedByTopic = balancedByTopic.slice(0, limit);
    }
    
    questions = balancedByTopic;
  }
  
  // Shuffle the final set of questions to avoid having them grouped by difficulty or topic
  return questions.sort(() => 0.5 - Math.random());
}

export async function POST(request: NextRequest) {
  try {
    // Parse JSON body to get filter parameters
    const params = await request.json();

    // Build MongoDB query from parameters
    const query: QuestionQuery = {};

    // Always require DPS approved questions
    query.DPS_approved = true;

    // Handle required single value parameters
    if (params.education_board) query.education_board = params.education_board;
    if (params.class) query.class = params.class;
    if (params.subject) query.subject = params.subject;
    if (params.q_number) {
      // If q_number is provided, filter by exact match
      const qNumber = parseInt(params.q_number);
      if (!isNaN(qNumber)) {
        query.q_number = { $eq: qNumber };
      } else {
        // If q_number is not a valid number, ignore it
        delete query.q_number;
      }
    }

    // Track if specific difficulty levels were requested
    let hasDifficultyFilter = false;
    let selectedTopics: string[] | null = null;

    // Handle comma-separated topics with $in operator
    // If topic is missing or empty, don't filter by topic (include all topics)
    if (params.topic && params.topic.trim() !== '') {
      selectedTopics = params.topic.split(',').map((t: string) => t.trim());
      if (selectedTopics && selectedTopics.length > 0) {
        query.topic = { $in: selectedTopics };
      }
    }

    // Handle comma-separated difficulty levels with $in operator
    // If difficulty_level is missing or empty, don't filter by difficulty (include all levels)
    if (params.difficulty_level && params.difficulty_level.trim() !== '') {
      const difficultyLevels = params.difficulty_level.split(',').map((d: string) => d.trim());
      query.difficulty_level = { $in: difficultyLevels };
      hasDifficultyFilter = true;
    }

    // Handle comma-separated question types with $in operator
    if (params.q_type && params.q_type.trim() !== '') {
      const types = params.q_type.split(',').map((t: string) => t.trim());
      query.q_type = { $in: types };
      console.log('Filtering by question types:', types);
    }
    
    // Handle inCourse filter (Yes/No/Unmarked)
    if (params.inCourse) {
      const inCourseValues = params.inCourse.split(',');
      
      if (inCourseValues.length > 0 && inCourseValues.length < 3) {
        if (inCourseValues.includes('Yes') && inCourseValues.includes('No')) {
          // Both Yes and No, but not Unmarked - exclude undefined
          query.inCourse = { $ne: undefined };
        } else if (inCourseValues.includes('Yes') && inCourseValues.includes('Unmarked')) {
          // Yes and Unmarked, but not No
          query.$or = [{ inCourse: true }, { inCourse: undefined }];
        } else if (inCourseValues.includes('No') && inCourseValues.includes('Unmarked')) {
          // No and Unmarked, but not Yes
          query.$or = [{ inCourse: false }, { inCourse: undefined }];
        } else if (inCourseValues.includes('Yes')) {
          // Only Yes
          query.inCourse = true;
        } else if (inCourseValues.includes('No')) {
          // Only No
          query.inCourse = false;
        } else if (inCourseValues.includes('Unmarked')) {
          // Only Unmarked
          query.inCourse = undefined;
        }
      }
    }
    
    // Handle isCorrect filter (Yes/No/Unmarked)
    if (params.isCorrect) {
      const isCorrectValues = params.isCorrect.split(',');
      
      if (isCorrectValues.length > 0 && isCorrectValues.length < 3) {
        if (isCorrectValues.includes('Yes') && isCorrectValues.includes('No')) {
          // Both Yes and No, but not Unmarked - exclude undefined
          query.isCorrect = { $ne: undefined };
        } else if (isCorrectValues.includes('Yes') && isCorrectValues.includes('Unmarked')) {
          // Yes and Unmarked, but not No
          query.$or = query.$or || [];
          query.$or.push({ isCorrect: true });
          query.$or.push({ isCorrect: undefined });
        } else if (isCorrectValues.includes('No') && isCorrectValues.includes('Unmarked')) {
          // No and Unmarked, but not Yes
          query.$or = query.$or || [];
          query.$or.push({ isCorrect: false });
          query.$or.push({ isCorrect: undefined });
        } else if (isCorrectValues.includes('Yes')) {
          // Only Yes
          query.isCorrect = true;
        } else if (isCorrectValues.includes('No')) {
          // Only No
          query.isCorrect = false;
        } else if (isCorrectValues.includes('Unmarked')) {
          // Only Unmarked
          query.isCorrect = undefined;
        }
      }
    }

    // Handle DPS_approved filter (Yes/No/Unmarked) - always set to true for filtering
    // We're overriding any existing filter logic to ensure questions are always DPS approved
    
    // Handle moderator view - only show questions marked as inCourse, isCorrect and DPS approved
    if (params.moderatorView === true) {
      // Add $and condition to ensure we only show questions that are marked as in course, correct and DPS approved
      query.$and = query.$and || [];
      query.$and.push({ inCourse: true });
      query.$and.push({ isCorrect: true });
      query.$and.push({ DPS_approved: true });
    }

    // Get pagination parameters
    const page = parseInt(params.page) || 1;
    const limit = parseInt(params.amount) || 20;
    const skip = (page - 1) * limit;

    const client = await clientPromise;
    const db = client.db();

    // Process user's question tracking history if available
    let questionPool: Question[] = [];
    
    if (params.userId && params.trackedQuestions) {
      let trackedQuestions;
      try {
        trackedQuestions = JSON.parse(params.trackedQuestions);
      } catch (e) {
        console.error("Failed to parse tracked questions:", e);
        trackedQuestions = {};
      }
      
      // Create arrays to hold different question IDs based on their status
      const successQuestionIds: string[] = [];
      const failedQuestionIds: string[] = [];
      const unsureQuestionIds: string[] = [];
      
      // Sort tracked questions by status
      Object.keys(trackedQuestions).forEach(questionId => {
        const status = trackedQuestions[questionId].status;
        if (status === 'success') {
          successQuestionIds.push(questionId);
        } else if (status === 'failed') {
          failedQuestionIds.push(questionId);
        } else if (status === 'unsure') {
          unsureQuestionIds.push(questionId);
        }
      });
      
      // Convert string IDs to ObjectId instances
      const successObjectIds = successQuestionIds.map(id => new ObjectId(id));
      const failedObjectIds = failedQuestionIds.map(id => new ObjectId(id));
      const unsureObjectIds = unsureQuestionIds.map(id => new ObjectId(id));
      
      // Query for fresh questions (not attempted by user)
      const freshQuestionsQuery = {
        ...query,
        _id: { $nin: [...successObjectIds, ...failedObjectIds, ...unsureObjectIds] }
      };
      
      // Set minimum percentages for review questions (Anki-like)
      const MIN_FAILED_PERCENTAGE = 0.25; // At least 25% failed questions
      const MIN_UNSURE_PERCENTAGE = 0.15; // At least 15% unsure questions
      
      // Calculate minimum counts
      const minFailedCount = Math.ceil(limit * MIN_FAILED_PERCENTAGE);
      const minUnsureCount = Math.ceil(limit * MIN_UNSURE_PERCENTAGE);
      
      // Calculate maximum fresh questions to allow
      const maxFreshCount = limit - (minFailedCount + minUnsureCount);
      
      // Get all matching questions first for balancing - for fresh questions
      const allFreshQuestions = await db.collection('Questions')
        .find(freshQuestionsQuery)
        .toArray() as Question[];
      
      // Balance fresh questions based on difficulty and topics
      const balancedFreshQuestions = await balanceQuestions(
        allFreshQuestions,
        maxFreshCount,
        hasDifficultyFilter,
        selectedTopics
      );
      
      // Get fresh questions - limited to make room for review questions
      const freshQuestions = balancedFreshQuestions.slice(0, maxFreshCount);
      
      // Determine how many failed questions to include
      let targetFailedCount = minFailedCount;
      if (freshQuestions.length < maxFreshCount) {
        // If we have fewer fresh questions than expected, increase the review questions
        const shortfall = maxFreshCount - freshQuestions.length;
        targetFailedCount += Math.floor(shortfall * 0.6); // 60% of shortfall goes to failed questions
      }
      
      // Get failed questions if available
      let failedQuestions: Question[] = [];
      if (failedQuestionIds.length > 0) {
        const failedToIncludeCount = Math.min(targetFailedCount, failedQuestionIds.length);
        
        // Get all failed questions that match criteria
        const allFailedQuestions = await db.collection('Questions')
          .find({ ...query, _id: { $in: failedQuestionIds.map(id => new ObjectId(id)) } })
          .toArray() as Question[];
          
        // Balance failed questions (if there are enough)
        if (allFailedQuestions.length > failedToIncludeCount) {
          failedQuestions = await balanceQuestions(
            allFailedQuestions,
            failedToIncludeCount,
            hasDifficultyFilter,
            selectedTopics
          );
        } else {
          failedQuestions = allFailedQuestions;
        }
      }
      
      // Determine how many unsure questions to include
      let targetUnsureCount = minUnsureCount;
      if (freshQuestions.length < maxFreshCount && failedQuestions.length < targetFailedCount) {
        // If we have fewer fresh AND failed questions than expected, put more into unsure
        const totalShortfall = (maxFreshCount - freshQuestions.length) + 
                              (targetFailedCount - failedQuestions.length);
        targetUnsureCount += totalShortfall;
      }
      
      // Get unsure questions if available
      let unsureQuestions: Question[] = [];
      if (unsureQuestionIds.length > 0) {
        // Get all unsure questions that match criteria
        const allUnsureQuestions = await db.collection('Questions')
          .find({ ...query, _id: { $in: unsureQuestionIds.map(id => new ObjectId(id)) } })
          .toArray() as Question[];
          
        // Balance unsure questions (if there are enough)
        const unsureToIncludeCount = Math.min(targetUnsureCount, unsureQuestionIds.length);
        if (allUnsureQuestions.length > unsureToIncludeCount) {
          unsureQuestions = await balanceQuestions(
            allUnsureQuestions,
            unsureToIncludeCount,
            hasDifficultyFilter,
            selectedTopics
          );
        } else {
          unsureQuestions = allUnsureQuestions;
        }
      }
      
      // Combine all question types
      questionPool = [...freshQuestions, ...failedQuestions, ...unsureQuestions];
      
      // If we still don't have enough questions, just get any that match the criteria
      if (questionPool.length < limit) {
        // Get all matching questions
        const allRemainingQuestions = await db.collection('Questions')
          .find(query)
          .toArray() as Question[];
          
        // Filter out questions we already have
        const questionIds = questionPool.map(q => q._id.toString());
        const remainingQuestions = allRemainingQuestions.filter(q => 
          !questionIds.includes(q._id.toString())
        );
        
        // Balance remaining questions
        const balancedRemaining = await balanceQuestions(
          remainingQuestions,
          limit - questionPool.length,
          hasDifficultyFilter,
          selectedTopics
        );
          
        questionPool = [...questionPool, ...balancedRemaining];
      }
      
      // Shuffle the questions to mix fresh with review questions
      questionPool = questionPool.sort(() => 0.5 - Math.random());
      
      // Limit to requested number
      questionPool = questionPool.slice(0, limit);
      
      console.log(`Found ${questionPool.length} questions based on user tracking history`);
      console.log(`Composition: ${freshQuestions.length} fresh, ${failedQuestions.length} failed, ${unsureQuestions.length} unsure`);
      
      return NextResponse.json(questionPool);
    } else {
      // Standard query without user tracking
      // Log the final query for debugging
      console.log('Final query:', JSON.stringify(query));

      // Find all questions matching the criteria (without pagination)
      const allQuestions = await db.collection('Questions')
        .find(query)
        .toArray() as Question[];
        
      console.log(`Found ${allQuestions.length} matching questions before balancing`);
      
      // Apply balancing algorithm
      const balancedQuestions = await balanceQuestions(
        allQuestions, 
        limit, 
        hasDifficultyFilter,
        selectedTopics
      );
      
      // Apply pagination to the balanced questions
      const pagedQuestions = balancedQuestions.slice(skip, skip + limit);
      
      console.log(`Returning ${pagedQuestions.length} balanced questions for page ${page}, limit ${limit}`);

      return NextResponse.json(pagedQuestions);
    }
  } catch (error) {
    console.error('Failed to fetch questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

// Keep the GET method for backward compatibility or remove if not needed
export async function GET() {
  return NextResponse.json(
    { error: 'Method not supported, use POST instead' },
    { status: 405 }
  );
}