import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ids } = body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ message: 'No valid IDs provided' }, { status: 400 });
    }
    
    // Convert string IDs to ObjectIds
    const objectIds = ids.map(id => {
      try {
        return new ObjectId(id);
      } catch (error) {
        console.error(`Invalid ObjectId: ${id}, error: ${error}`);
        return null;
      }
    }).filter(id => id !== null);
    
    if (objectIds.length === 0) {
      return NextResponse.json([]);
    }
    
    // Connect to the database
    const client = await clientPromise;
    const db = client.db();
    
    // Find PDF question sets by their IDs
    const pdfSets = await db.collection('QuestionSets')
      .find({ 
        _id: { $in: objectIds },
        question_pdf_blob: { $exists: true }
      })
      .project({
        _id: 1,
        label: 1,
        question_pdf_blob: 1,
        solution_pdf_blob: 1
      })
      .toArray();
    
    return NextResponse.json(pdfSets);
  } catch (error) {
    console.error('Error fetching PDF question sets:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}