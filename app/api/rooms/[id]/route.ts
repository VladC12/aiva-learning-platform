import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { TrackedQuestion } from '@/models/Question';

export async function GET(
  request: Request,
  // eslint-disable-next-line
  context: any
) {
  const { params: { id: roomId } } = await context;
  
  try {
    if (!roomId) {
      console.error('Room ID is required');
      return NextResponse.json(
        { message: 'Room ID is required' },
        { status: 400 }
      );
    }

    // Connect to database
    const client = await clientPromise;
    const db = client.db();

    // Find the room with the given ID
    let roomObjectId;
    try {
      roomObjectId = new ObjectId(roomId);
    } catch (error) {
      console.error(`Invalid room ID: ${roomId}, ${error}`);
      return NextResponse.json(
        { message: 'Invalid room ID format' },
        { status: 400 }
      );
    }

    const room = await db.collection('Rooms').findOne({ _id: roomObjectId });

    if (!room) {
      return NextResponse.json(
        { message: 'Room not found' },
        { status: 404 }
      );
    }

    // Fetch all students in the room
    const studentIds = room.students.map((id: string) => {
      try {
        return new ObjectId(id);
      } catch (error) {
        console.error(`Invalid student ID: ${id}, ${error}`);
        return null;
      }
    }).filter(Boolean);

    const students = await db.collection('Users')
      .find({ _id: { $in: studentIds } })
      .project({
        password: 0,
        password_reset_token: 0,
        password_reset_expiry: 0
      })
      .toArray();

    // Process student data to include question statistics
    const studentsWithStats = students.map(student => {
      const questionTracking = student.question_tracking || {};
      const questions = Object.values(questionTracking);

      return {
        ...student,
        totalQuestions: questions.length,
        successQuestions: (questions as TrackedQuestion[]).filter(q => q.status === 'success').length,
        failedQuestions: (questions as TrackedQuestion[]).filter(q => q.status === 'failed').length,
        unsureQuestions: (questions as TrackedQuestion[]).filter(q => q.status === 'unsure').length
      };
    });

    return NextResponse.json({
      room: {
        ...room,
        students: studentsWithStats
      }
    });
  } catch (error) {
    console.error('Error fetching room data:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}