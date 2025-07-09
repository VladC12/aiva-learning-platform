'use client';

import { useEffect } from 'react';

// This component periodically sends pings to track user session time
export default function SessionTracker() {
  useEffect(() => {
    // Check if we're in the browser
    if (typeof window === 'undefined') return;
    
    // Get the session start time or set it if it doesn't exist
    const sessionStartTime = sessionStorage.getItem('sessionStartTime') || 
                            Date.now().toString();
    
    if (!sessionStorage.getItem('sessionStartTime')) {
      sessionStorage.setItem('sessionStartTime', sessionStartTime);
    }
    
    // Ping interval in milliseconds (15 minutes - less frequent to reduce database load)
    const PING_INTERVAL = 15 * 60 * 1000;
    
    // Function to send a session ping with minimal data
    const pingSession = async () => {
      try {
        const sessionDuration = Date.now() - parseInt(sessionStartTime);
        
        await fetch('/api/user-activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            activityType: 'session_ping',
            metadata: {
              sessionDuration: sessionDuration, // in milliseconds
              page: window.location.pathname
            }
          }),
          credentials: 'include' // Important: include credentials to send cookies
        });
      } catch (error) {
        console.error('Failed to send session ping:', error);
      }
    };
    
    // Set up interval to ping the server
    const intervalId = setInterval(pingSession, PING_INTERVAL);
    
    // Set up beforeunload event to track session end
    const handleBeforeUnload = () => {
      // Calculate total session time
      const sessionDuration = Date.now() - parseInt(sessionStartTime);
      
      // Use sendBeacon for more reliable data sending during page unload
      navigator.sendBeacon(
        '/api/user-activity',
        JSON.stringify({
          activityType: 'logout',
          metadata: {
            sessionDuration: sessionDuration,
            page: window.location.pathname
          }
        })
      );
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Initial ping
    pingSession();
    
    // Clean up on component unmount
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
  
  // This component doesn't render anything
  return null;
}