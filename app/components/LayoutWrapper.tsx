'use client';

import { ReactNode } from 'react';
import SessionTracker from 'app/components/SessionTracker';

interface LayoutWrapperProps {
  children: ReactNode;
}

// This component wraps the app to provide session tracking functionality
export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  return (
    <>
      <SessionTracker />
      {children}
    </>
  );
}