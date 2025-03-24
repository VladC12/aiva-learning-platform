'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './ProfileDropdown.module.css';

interface User {
  username: string;
  email_address: string;
  first_name: string;
  last_name: string;
  education_board: string;
  profile_picture?: string;
}

export default function ProfileDropdown() {
  const [user, setUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/auth/login';
  };

  return (
    <div className={styles.dropdown}>
      <button
        className={styles.profileButton}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Image
          src={user?.profile_picture || '/profile-placeholder.svg'}
          alt="Profile"
          width={32}
          height={32}
          className={styles.profileImage}
        />
        <span>{user ? `${user.first_name} ${user.last_name}` : 'Profile'}</span>
      </button>

      {isOpen && (
        <div className={styles.dropdownMenu}>
          {user && (
            <div className={styles.userInfo}>
              <p>{user.email_address}</p>
              <p>{user.education_board}</p>
            </div>
          )}
          <button
            className={styles.logoutButton}
            onClick={handleLogout}
          >
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}