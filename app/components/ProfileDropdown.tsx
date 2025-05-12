'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './ProfileDropdown.module.css';
import { useUser } from '../../context/UserContext';

export default function ProfileDropdown() {
  const { user, logout } = useUser();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  // Close dropdown when an item is clicked
  const handleItemClick = () => {
    setIsOpen(false);
  };

  return (
    <div className={styles.dropdown}>
      <button
        className={styles.profileButton}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Image
          src={'/profile-placeholder.svg'}
          alt="Profile"
          width={32}
          height={32}
          className={styles.profileImage}
        />
        <span>
          {user ? `${user.username || 'Profile'}` : 'Profile'}
        </span>
      </button>

      {isOpen && (
        <div className={styles.dropdownMenu}>
          {user && (
            <div className={styles.userInfo}>
              <Link href="/auth/me" className={styles.menuItem} onClick={handleItemClick}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                View Profile
              </Link>
            </div>
          )}
          <button
            className={styles.logoutButton}
            onClick={handleLogout}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}