import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function DELETE(
  request: NextRequest,
  // eslint-disable-next-line
  context: any
) {
  try {
    // Properly await the params to fix the error
    const { params }  = await context;
    const { id: roomId, setId } = await params;
    
    // Validate parameters
    if (!roomId || !setId) {
      console.error('Room ID or Set ID is missing');
      return NextResponse.json(
        { error: 'Room ID and question set ID are required' },
        { status: 400 }
      );
    }
    
    // Connect to database
    const client = await clientPromise;
    const db = client.db();
    
    const updateQuery = {
      // eslint-disable-next-line
      $pull: {} as any,
      $set: { updated_at: new Date() }
    };
    
    // Set the pull operation field dynamically to fix the type error
    updateQuery.$pull.question_sets = new ObjectId(setId);
    
    // Remove the question set from the room
    const result = await db.collection('Rooms').updateOne(
      { _id: new ObjectId(roomId) },
      updateQuery
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    
    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Question set was not found in this room' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Question set removed from room successfully'
    });
  } catch (error) {
    console.error('Error removing question set from room:', error);
    return NextResponse.json(
      { error: 'Failed to remove question set from room' },
      { status: 500 }
    );
  }
}
