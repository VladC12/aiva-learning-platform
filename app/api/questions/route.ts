import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Question, QuestionQuery } from '@/models/Question';



export async function POST(request: NextRequest) {
  try {
    // Parse JSON body to get filter parameters
    const params = await request.json();

    // Build MongoDB query from parameters
    const query: QuestionQuery = {};

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

    // Handle DPS_approved filter (Yes/No/Unmarked)
    // DPS_approved in the database is DPS_approved
    if (params.DPS_approved) {
      const DPS_approvedValues = params.DPS_approved.split(',');

      if (DPS_approvedValues.length > 0 && DPS_approvedValues.length < 3) {
        if (DPS_approvedValues.includes('Yes') && DPS_approvedValues.includes('No')) {
          // Both Yes and No, but not Unmarked - exclude undefined
          query['DPS_approved'] = { $ne: undefined };
        } else if (DPS_approvedValues.includes('Yes') && DPS_approvedValues.includes('Unmarked')) {
          // Yes and Unmarked, but not No
          query.$or = query.$or || [];
          query.$or.push({ 'DPS_approved': true });
          query.$or.push({ 'DPS_approved': undefined });
        } else if (DPS_approvedValues.includes('No') && DPS_approvedValues.includes('Unmarked')) {
          // No and Unmarked, but not Yes
          query.$or = query.$or || [];
          query.$or.push({ 'DPS_approved': false });
          query.$or.push({ 'DPS_approved': undefined });
        } else if (DPS_approvedValues.includes('Yes')) {
          // Only Yes
          query['DPS_approved'] = true;
        } else if (DPS_approvedValues.includes('No')) {
          // Only No
          query['DPS_approved'] = false;
        } else if (DPS_approvedValues.includes('Unmarked')) {
          // Only Unmarked
          query['DPS_approved'] = undefined;
        }
      }
    }
    
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