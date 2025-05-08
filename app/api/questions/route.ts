import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Question } from '@/models/Question';

// Define a more specific type for the MongoDB query
interface QuestionQuery {
  education_board?: string;
  class?: string;
  subject?: string;
  topic?: { $in: string[] };
  difficulty_level?: { $in: string[] };
}

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

    const client = await clientPromise;
    const db = client.db();

    // Find questions matching the criteria, limit to 20 results
    const questions = await db.collection('Questions')
      .find(query)
      .limit(20)
      .toArray();

    console.log(`Found ${questions.length} matching questions`);

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