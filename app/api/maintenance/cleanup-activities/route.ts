import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Define the activity interface
interface UserActivity {
  type: string;
  timestamp: Date | string;
  sessionDuration?: number;
  page?: string;
  metadata?: Record<string, unknown>;
}

// Define the user interface with activities
interface UserWithActivities {
  _id: ObjectId;
  recentActivities?: UserActivity[];
  activityCounts?: Record<string, number>;
  lastActive?: Date;
  lastLogin?: Date;
  email?: string;
  name?: string;
  role?: string;
}

// Simple cleanup endpoint for development
export async function GET() {
  try {
    // Connect to the database
    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Calculate date for one week ago
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    // Find users with recent activities
    const users = await usersCollection.find({ 
      recentActivities: { $exists: true } 
    }).toArray() as UserWithActivities[];
    
    let modifiedCount = 0;
    
    // Process each user to filter out old activities
    for (const user of users) {
      if (Array.isArray(user.recentActivities)) {
        // Filter activities to keep only those less than a week old
        const filteredActivities = user.recentActivities.filter((activity: UserActivity) => {
          const activityDate = new Date(activity.timestamp);
          return activityDate >= oneWeekAgo;
        });
        
        // Update the user document if activities were filtered out
        if (filteredActivities.length !== user.recentActivities.length) {
          await usersCollection.updateOne(
            { _id: user._id },
            { $set: { recentActivities: filteredActivities } }
          );
          modifiedCount++;
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Cleaned up old activity data for ${modifiedCount} users`
    });
  } catch (error) {
    console.error('Error during activity data cleanup:', error);
    return NextResponse.json(
      { message: 'Internal server error' }, 
      { status: 500 }
    );
  }
}