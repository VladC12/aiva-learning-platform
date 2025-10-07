import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest,
  // eslint-disable-next-line
  context: any
) {
  try {
    // Parse request body
    const data = await req.json();
    const { label, questions, format, appointToRoom, roomId } = data;

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
    
    // If requested to appoint to room and roomId is provided
    if (appointToRoom && roomId) {
      try {
        // Fix the TypeScript error with the $push operator
        const updateQuery = {
          $push: {} as any,
          $setOnInsert: { updated_at: new Date() }
        };
        
        // Set the push operation field dynamically to fix the type error
        updateQuery.$push.question_sets = result.insertedId;
        
        // Update the room document to include this question set
        await db.collection('Rooms').updateOne(
          { _id: new ObjectId(roomId) },
          updateQuery,
          { upsert: true }
        );
        
        console.log(`Question set ${result.insertedId} appointed to room ${roomId}`);
      } catch (roomError) {
        console.error('Error appointing question set to room:', roomError);
        // Continue execution even if room update fails
      }
    }

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
    const roomId = searchParams.get('roomId');
    const globalOnly = searchParams.get('globalOnly') === 'true';

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
    } else if (roomId) {
      // Get question sets for a specific room
      try {
        // First get the room to find its question set IDs
        const room = await db.collection('Rooms').findOne({ 
          _id: new ObjectId(roomId) 
        });

        if (!room) {
          return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }

        // Check if the room has any question sets
        if (!room.question_sets || room.question_sets.length === 0) {
          return NextResponse.json([]);
        }

        // Fetch all the question sets using the IDs from the room
        const questionSets = await db.collection('QuestionSets')
          .find({ _id: { $in: room.question_sets } })
          .sort({ created_at: -1 })
          .toArray();

        return NextResponse.json(questionSets);
      } catch (error) {
        console.error('Error fetching room question sets:', error);
        return NextResponse.json({ error: 'Failed to fetch room question sets' }, { status: 500 });
      }
    } else if (globalOnly) {
      // Get all question sets that are not associated with any room
      
      // First, get all rooms and compile a list of all question set IDs that are assigned to rooms
      const rooms = await db.collection('Rooms').find({}).toArray();
      
      // Collect all question set IDs that are assigned to rooms
      const assignedQuestionSetIds = [];
      for (const room of rooms) {
        if (room.question_sets && Array.isArray(room.question_sets)) {
          assignedQuestionSetIds.push(...room.question_sets);
        }
      }
      
      // Query for question sets that are NOT in the list of assigned IDs
      let query = {};
      if (assignedQuestionSetIds.length > 0) {
        query = { _id: { $nin: assignedQuestionSetIds } };
      }
      
      const globalQuestionSets = await db.collection('QuestionSets')
        .find(query)
        .sort({ created_at: -1 })
        .limit(12) // Limit the number of results
        .toArray();
        
      return NextResponse.json(globalQuestionSets);
    } else {
      // Get all question sets (with a limit to avoid overloading)
      const questionSets = await db.collection('QuestionSets')
        .find({})
        .sort({ created_at: -1 })
        .limit(12) // Limit the number of results
        .toArray();

      return NextResponse.json(questionSets);
    }
  } catch (error) {
    console.error('Error fetching question sets:', error);
    return NextResponse.json({ error: 'Failed to fetch question sets' }, { status: 500 });
  }
}