# User Activity Tracking System

This document describes the user activity tracking system implemented in the learning platform.

## Overview

The system tracks user activity to provide analytics on:
- Number of logins per user
- Session durations
- Page visits
- User engagement patterns

## Data Structure

User documents in MongoDB are updated with the following activity-related fields:

```javascript
{
  // ... other user fields
  
  // Aggregate counts (permanent, for analytics)
  "activityCounts": {
    "login": 42,
    "logout": 39,
    "session_ping": 156
  },
  
  // Most recent activity timestamp
  "lastActive": ISODate("2023-04-15T10:32:45Z"),
  
  // Most recent login timestamp
  "lastLogin": ISODate("2023-04-15T09:15:22Z"),
  
  // Recent activities (limited to 7 days of data)
  "recentActivities": [
    {
      "type": "login",
      "timestamp": ISODate("2023-04-15T09:15:22Z"),
      "sessionDuration": null,
      "page": "/auth/login"
    },
    {
      "type": "session_ping",
      "timestamp": ISODate("2023-04-15T09:30:22Z"),
      "sessionDuration": 900000,
      "page": "/dashboard"
    },
    {
      "type": "logout",
      "timestamp": ISODate("2023-04-15T10:32:45Z"),
      "sessionDuration": 4643000,
      "page": "/courses/intro-to-js"
    }
    // ... more activities
  ]
}
```

## Tracked Events

1. **Login** (`login`): When a user logs in
2. **Session Pings** (`session_ping`): Periodic updates while the user is active
3. **Logout** (`logout`): When a user logs out or closes the browser

## Data Retention

- Detailed activity data is kept for 7 days
- Aggregate counts are maintained permanently
- A maintenance endpoint (`/api/maintenance/cleanup-activities`) can be called to clean up old activity data

## Implementation Details

- Login events are tracked after successful authentication
- Session pings occur every 15 minutes while the user is active
- Logout events are captured using the browser's `beforeunload` event

## Usage for Analytics

This data can be used to:
- Calculate average session duration
- Identify peak usage times
- Track user engagement over time
- Monitor usage patterns by user role