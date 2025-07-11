import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function GET(
  request: Request,
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
    let teacherObjectId;
    
    try {
      teacherObjectId = new ObjectId(teacherId);
    } catch (error) {
      console.error(`Invalid teacher ID: ${teacherId}, ${error}`);
      return NextResponse.json(
        { message: 'Invalid user ID format' },
        { status: 400 }
      );
    }
    
    const teacher = await db.collection('Users').findOne({
      _id: teacherObjectId,
      type: 'teacher'
    });

    if (!teacher) {
      return NextResponse.json(
        { message: 'Access denied: Only teachers can view student details' },
        { status: 403 }
      );
    }
    
    // Get the student ID from params - fixed to use extracted id from params
    const { params } = await context;
    const { id: studentId } = await params;

    let studentObjectId;
    try {
      studentObjectId = new ObjectId(studentId);
    } catch (error) {
      console.error(`Invalid student ID: ${studentId}, ${error}`);
      return NextResponse.json(
        { message: 'Invalid student ID format' },
        { status: 400 }
      );
    }
    
    // Check if the teacher and student are in the same room
    const rooms = await db.collection('Rooms').find({
      teachers: teacherObjectId,
      students: studentObjectId
    }).toArray();
    
    if (rooms.length === 0) {
      return NextResponse.json(
        { message: 'Access denied: You are not authorized to view this student\'s data' },
        { status: 403 }
      );
    }
    
    // If authorized, get the student data
    const student = await db.collection('Users').findOne(
      { _id: studentObjectId },
      { projection: { password: 0, password_reset_token: 0, password_reset_expiry: 0 } }
    );
    
    if (!student) {
      return NextResponse.json(
        { message: 'Student not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ student });
  } catch (error) {
    console.error('Error fetching student data:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}