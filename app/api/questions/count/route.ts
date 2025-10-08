import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { QuestionQuery } from '@/models/Question';

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

    // Handle comma-separated topics with $in operator
    if (params.topic && params.topic.trim() !== '') {
      const topics = params.topic.split(',').map((t: string) => t.trim());
      query.topic = { $in: topics };
    }

    // Handle comma-separated difficulty levels with $in operator
    if (params.difficulty_level && params.difficulty_level.trim() !== '') {
      const difficultyLevels = params.difficulty_level.split(',').map((d: string) => d.trim());
      query.difficulty_level = { $in: difficultyLevels };
    }
    
    // Handle comma-separated question types with $in operator
    if (params.q_type && params.q_type.trim() !== '') {
      const types = params.q_type.split(',').map((t: string) => t.trim());
      query.q_type = { $in: types };
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
          query.$or = query.$or || [];
          query.$or.push({ inCourse: true });
          query.$or.push({ inCourse: undefined });
        } else if (inCourseValues.includes('No') && inCourseValues.includes('Unmarked')) {
          // No and Unmarked, but not Yes
          query.$or = query.$or || [];
          query.$or.push({ inCourse: false });
          query.$or.push({ inCourse: undefined });
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

    // Handle moderator view - only show questions marked as inCourse and isCorrect
    if (params.moderatorView === true) {
      // Add $and condition to ensure we only show questions that are marked as in course and correct
      query.$and = query.$and || [];
      query.$and.push({ inCourse: true });
      query.$and.push({ isCorrect: true });
      query.$and.push({ DPS_approved: true });
    }

    // Connect to the database
    const client = await clientPromise;
    const db = client.db();
    
    // Get the count of questions matching the query
    const count = await db.collection('Questions').countDocuments(query);
    
    // Return the count
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error counting questions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}