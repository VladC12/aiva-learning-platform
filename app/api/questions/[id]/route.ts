import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

export async function PATCH(
  request: NextRequest,
  // eslint-disable-next-line
  context: any
) {
  try {

    const { params } = await context;
    const { id: questionId } = await params;
    
    const updateData = await request.json();

    // Validate the questionId
    if (!ObjectId.isValid(questionId)) {
      return NextResponse.json(
        { error: 'Invalid question ID' },
        { status: 400 }
      );
    }

    // Connect to the database
    const client = await clientPromise;
    const db = client.db();

    // Validate update data - only allow specific fields
    const allowedFields = [
      'difficulty_level', 'inCourse', 'isHOTS', 'isCorrect', 'q_type',
      'modDifficulty_level', 'modInCourse', 'modIsHOTS', 'modIsCorrect', 'modQ_type', 'reviewer_note'
    ];
    // eslint-disable-next-line
    const filteredUpdate: Record<string, any> = {};

    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdate[key] = updateData[key];
      }
    });

    if (Object.keys(filteredUpdate).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Update the question
    const result = await db.collection('Questions').updateOne(
      { _id: new ObjectId(questionId) },
      { $set: filteredUpdate }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Question updated successfully'
    });
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}