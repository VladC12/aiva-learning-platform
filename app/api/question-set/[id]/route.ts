import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest,
  // eslint-disable-next-line
  context: any
) {
  try {

    const { params } = await context;
    const { id: q } = await params;
    
    if (!q) {
      return NextResponse.json({ error: 'Question set ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    
    let objectId;
    try {
      objectId = new ObjectId(q);
    } catch (error) {
      console.error(`Invalid ObjectId: ${q}, error: ${error}`);
      return NextResponse.json({ error: 'Invalid question set ID format' }, { status: 400 });
    }

    // Find question set first to determine its type
    const questionSet = await db.collection('QuestionSets').findOne({ _id: objectId });
    const questionSetLabel = questionSet?.label || 'Unknown Set';

    if (!questionSet) {
      return NextResponse.json({ error: 'Question set not found' }, { status: 404 });
    }

    // If it's a PDF question set, return it directly
    if (questionSet.question_pdf_blob) {
      return NextResponse.json(questionSet);
    }

    // For regular question sets, fetch the associated questions
    if (!questionSet.questions || !Array.isArray(questionSet.questions)) {
      return NextResponse.json({ error: 'Invalid question set format' }, { status: 400 });
    }
    
    // Convert question IDs to ObjectIds
    const questionIds = questionSet.questions.map((id: string) => {
      try {
        return new ObjectId(id);
      } catch (error) {
        console.error(`Invalid ObjectId: ${id}, error: ${error}`);
        return null;
      }
    }).filter((id: ObjectId | null) => id !== null);
    
    if (questionIds.length === 0) {
      return NextResponse.json([]);
    }
    
    // Fetch all questions
    const questions = await db.collection('Questions')
      .find({ _id: { $in: questionIds } })
      .toArray();

    return NextResponse.json({ questions: questions, label: questionSetLabel });
  } catch (error) {
    console.error('Error fetching question set:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, 
  // eslint-disable-next-line
  context: any
) {
  try {
    const { params } = await context;
    const { id } = await params;
    console.log('Received DELETE request for question set ID:', id);

    if (!id) {
      return NextResponse.json({ error: 'Question set ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      console.error(`Invalid ObjectId: ${id}, error: ${error}`);
      return NextResponse.json({ error: 'Invalid question set ID format' }, { status: 400 });
    }

    // Delete the question set
    const result = await db.collection('QuestionSets').deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Question set not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Question set deleted successfully' });
  } catch (error) {
    console.error('Error deleting question set:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}