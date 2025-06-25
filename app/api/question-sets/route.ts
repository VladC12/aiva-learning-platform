import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const data = await req.json();
    const { label, questions, format } = data;

    // Validate required fields
    if (!label || !questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'Invalid question set data' }, { status: 400 });
    }

    // Create new question set
    const questionSet = {
      label,
      questions: questions.map(q => q.toString()), // Ensure all IDs are strings
      format: format || 'dps', // Default to 'dps' if not specified
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Insert into database
    const client = await clientPromise;
    const db = client.db();
    const result = await db.collection('QuestionSets').insertOne(questionSet);

    return NextResponse.json({ 
      success: true, 
      id: result.insertedId.toString(),
      message: 'Question set created successfully' 
    });
  } catch (error) {
    console.error('Error creating question set:', error);
    return NextResponse.json({ error: 'Failed to create question set' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {    
    // Get query parameters
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    const client = await clientPromise;
    const db = client.db();

    if (id) {
      // Get a specific question set
      const questionSet = await db.collection('QuestionSets').findOne({ 
        _id: new ObjectId(id) 
      });

      if (!questionSet) {
        return NextResponse.json({ error: 'Question set not found' }, { status: 404 });
      }

      return NextResponse.json(questionSet);
    } else {
      // Get all question sets
      const questionSets = await db.collection('QuestionSets')
        .find({})
        .sort({ created_at: -1 })
        .toArray();

      return NextResponse.json(questionSets);
    }
  } catch (error) {
    console.error('Error fetching question sets:', error);
    return NextResponse.json({ error: 'Failed to fetch question sets' }, { status: 500 });
  }
}