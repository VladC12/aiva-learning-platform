import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  // eslint-disable-next-line
  context: any
) {
  try {
    // Get the token from cookies and verify authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Decode the token
    const decoded = jwt.decode(token) as { userId?: string };
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      );
    }

      // Connect to the database
    const client = await clientPromise;
    const db = client.db();
    
    // Check if the requesting user is a teacher
    const teacherId = decoded.userId;
    
    try {
      const _teacherObjectId = new ObjectId(teacherId);
    } catch (error) {
      console.error(`Invalid teacher ID: ${teacherId}, ${error}`);
      return NextResponse.json(
        { message: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Get the student ID from params - fixed to use extracted id from params
    const { params } = await context;
    const { id: roomId } = await params;

    // Get the room with its students
    const room = await db.collection('Rooms').findOne(
      { _id: new ObjectId(roomId) }
    );

    if (!room) {
      console.error(`Room not found: ${roomId}`);
      return NextResponse.json(
        { message: 'Room not found' },
        { status: 404 }
      );
    }

    // Get list of student IDs in this room
    const studentIds = room.students.map((id: string) => new ObjectId(id));

    // Get all students in this room with their question set tracking data
    const students = await db.collection('Users').find(
      { _id: { $in: studentIds } }
    ).project({
      _id: 1,
      question_sets_tracking: 1
    }).toArray();

    // Get list of all question sets assigned to this room
    const questionSets = await db.collection('QuestionSets').find(
      { _id: { $in: room.question_sets.map((id: string) => new ObjectId(id)) } }
    ).toArray();

    // Calculate performance metrics for each question set
    const questionSetStats = questionSets.map(set => {
      const setId = set._id.toString();
      const studentCompletions = students.filter(
        student => student.question_sets_tracking && student.question_sets_tracking[setId]
      );
      
      // Calculate average stats across all students who completed this set
      const totalStudents = students.length;
      const studentsCompleted = studentCompletions.length;

      if (studentsCompleted === 0) {
        // No completions yet
        return {
          _id: setId,
          title: set.title,
          totalStudents,
          studentsCompleted: 0,
          avgSuccessRate: 0,
          avgCompletionTime: 0,
          avgResults: {
            success: 0,
            failed: 0,
            unsure: 0
          },
          questionCount: set.questions.length,
          successRateDistribution: {
            excellent: 0,
            good: 0,
            average: 0,
            belowAverage: 0,
            poor: 0
          }
        };
      }

      // Calculate averages
      const successRateSum = studentCompletions.reduce(
        (sum, student) => sum + (student.question_sets_tracking[setId].successRate || 0),
        0
      );

      const completionTimeSum = studentCompletions.reduce(
        (sum, student) => sum + (student.question_sets_tracking[setId].sessionDuration || 0),
        0
      );

      // Calculate average results
      const successSum = studentCompletions.reduce(
        (sum, student) => sum + (student.question_sets_tracking[setId].results?.success || 0),
        0
      );

      const failedSum = studentCompletions.reduce(
        (sum, student) => sum + (student.question_sets_tracking[setId].results?.failed || 0),
        0
      );

      const unsureSum = studentCompletions.reduce(
        (sum, student) => sum + (student.question_sets_tracking[setId].results?.unsure || 0),
        0
      );

      // Calculate student success rate distribution
      const successRateDistribution = {
        excellent: 0,
        good: 0,
        average: 0,
        belowAverage: 0,
        poor: 0
      };
      
      studentCompletions.forEach(student => {
        const successRate = student.question_sets_tracking[setId].successRate || 0;
        if (successRate >= 90) {
          successRateDistribution.excellent++;
        } else if (successRate >= 75) {
          successRateDistribution.good++;
        } else if (successRate >= 60) {
          successRateDistribution.average++;
        } else if (successRate >= 40) {
          successRateDistribution.belowAverage++;
        } else {
          successRateDistribution.poor++;
        }
      });
      console.log(set)
      return {
        _id: setId,
        label: set.label,
        totalStudents,
        studentsCompleted,
        avgSuccessRate: successRateSum / studentsCompleted,
        avgCompletionTime: completionTimeSum / studentsCompleted,
        avgResults: {
          success: successSum / studentsCompleted,
          failed: failedSum / studentsCompleted,
          unsure: unsureSum / studentsCompleted
        },
        questionCount: set.questions.length,
        successRateDistribution
      };
    });

    return NextResponse.json({
      questionSets: questionSetStats
    });

  } catch (error) {
    console.error('Error fetching question set performance:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
