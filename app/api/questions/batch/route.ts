import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    
    if (!ids) {
      return NextResponse.json(
        { message: 'No question IDs provided' },
        { status: 400 }
      );
    }
    
    const questionIds = ids.split(',').filter(Boolean);
    
    // Connect to the database
    const client = await clientPromise;
    const db = client.db();
    const questionsCollection = db.collection('Questions');
    
    // Try to convert each ID to an ObjectId
    const objectIds = questionIds.map(id => {
      try {
        return new ObjectId(id);
      } catch (error) {
        console.error(`Invalid ObjectId: ${id}, ${error}`);
        return null;
      }
    }).filter(id => id !== null);
    
    if (objectIds.length === 0) {
      return NextResponse.json({ questions: [], total: 0, page, limit });
    }
    
    // Get total count for pagination
    const total = objectIds.length;
    
    // Calculate pagination slice for IDs
    const startIndex = (page - 1) * limit;
    const paginatedIds = objectIds.slice(startIndex, startIndex + limit);
    
    // Fetch paginated questions by their IDs
    const questions = await questionsCollection
      .find({ _id: { $in: paginatedIds } })
      .project({
        _id: 1,
        subject: 1,
        topic: 1,
        question: 1,
        solution: 1,
        difficulty_level: 1,
        class: 1
      })
      .toArray();
    
    return NextResponse.json({ 
      questions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching questions batch:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}