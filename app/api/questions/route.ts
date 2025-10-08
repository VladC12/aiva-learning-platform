import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Question, QuestionQuery } from '@/models/Question';
import { ObjectId } from 'mongodb';



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

    // Handle comma-separated topics with $in operator
    // If topic is missing or empty, don't filter by topic (include all topics)
    if (params.topic && params.topic.trim() !== '') {
      const topics = params.topic.split(',').map((t: string) => t.trim());
      query.topic = { $in: topics };
    }

    // Handle comma-separated difficulty levels with $in operator
    // If difficulty_level is missing or empty, don't filter by difficulty (include all levels)
    if (params.difficulty_level && params.difficulty_level.trim() !== '') {
      const difficultyLevels = params.difficulty_level.split(',').map((d: string) => d.trim());
      query.difficulty_level = { $in: difficultyLevels };
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

    // Handle isHOTS filter (Yes/No/Unmarked)
    if (params.isHOTS) {
      const isHOTSValues = params.isHOTS.split(',');
      
      if (isHOTSValues.length > 0 && isHOTSValues.length < 3) {
        if (isHOTSValues.includes('Yes') && isHOTSValues.includes('No')) {
          // Both Yes and No, but not Unmarked - exclude undefined
          query.isHOTS = { $ne: undefined };
        } else if (isHOTSValues.includes('Yes') && isHOTSValues.includes('Unmarked')) {
          // Yes and Unmarked, but not No
          query.$or = query.$or || [];
          query.$or.push({ isHOTS: true });
          query.$or.push({ isHOTS: undefined });
        } else if (isHOTSValues.includes('No') && isHOTSValues.includes('Unmarked')) {
          // No and Unmarked, but not Yes
          query.$or = query.$or || [];
          query.$or.push({ isHOTS: false });
          query.$or.push({ isHOTS: undefined });
        } else if (isHOTSValues.includes('Yes')) {
          // Only Yes
          query.isHOTS = true;
        } else if (isHOTSValues.includes('No')) {
          // Only No
          query.isHOTS = false;
        } else if (isHOTSValues.includes('Unmarked')) {
          // Only Unmarked
          query.isHOTS = undefined;
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
      
      // Get fresh questions - limited to make room for review questions
      const freshQuestions = await db.collection('Questions')
        .find(freshQuestionsQuery)
        .limit(maxFreshCount)
        .toArray() as Question[];
      
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
        
        // Randomly select a subset of failed questions
        const randomFailedIds = failedQuestionIds
          .sort(() => 0.5 - Math.random())
          .slice(0, failedToIncludeCount)
          .map(id => new ObjectId(id)); // Convert to ObjectId
        
        if (randomFailedIds.length > 0) {
          failedQuestions = await db.collection('Questions')
            .find({ ...query, _id: { $in: randomFailedIds } })
            .toArray() as Question[];
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
        const unsureToIncludeCount = Math.min(targetUnsureCount, unsureQuestionIds.length);
        
        // Randomly select a subset of unsure questions
        const randomUnsureIds = unsureQuestionIds
          .sort(() => 0.5 - Math.random())
          .slice(0, unsureToIncludeCount)
          .map(id => new ObjectId(id)); // Convert to ObjectId
        
        if (randomUnsureIds.length > 0) {
          unsureQuestions = await db.collection('Questions')
            .find({ ...query, _id: { $in: randomUnsureIds } })
            .toArray() as Question[];
        }
      }
      
      // Combine all question types
      questionPool = [...freshQuestions, ...failedQuestions, ...unsureQuestions];
      
      // If we still don't have enough questions, just get any that match the criteria
      if (questionPool.length < limit) {
        const additionalQuestions = await db.collection('Questions')
          .find(query)
          .skip(questionPool.length)  // Skip ones we already have
          .limit(limit - questionPool.length)
          .toArray() as Question[];
          
        questionPool = [...questionPool, ...additionalQuestions];
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

      // Find questions matching the criteria with pagination
      const questions = await db.collection('Questions')
        .find(query)
        .skip(skip)
        .limit(limit)
        .toArray();

      console.log(`Found ${questions.length} matching questions for page ${page}, limit ${limit}, skip ${skip}`);

      return NextResponse.json(questions as Question[]);
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