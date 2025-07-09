import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

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
    }).toArray();
    
    let modifiedCount = 0;
    
    // Process each user to filter out old activities
    for (const user of users) {
      if (Array.isArray(user.recentActivities)) {
        // Filter activities to keep only those less than a week old
        const filteredActivities = user.recentActivities.filter((activity: any) => {
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