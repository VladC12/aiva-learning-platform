'use client';

import Link from "next/link";
import styles from './Navbar.module.css';
import ProfileDropdown from './ProfileDropdown';
import { useUser } from 'context/UserContext';

export default function Navbar() {
  const { user } = useUser();
  
  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <div className={styles.brand}>
          <Link href="/">DPS Society</Link>
        </div>
        <div className={styles.navContent}>
          {(user?.type === 'reviewer' || user?.type === 'moderator' || user?.type === 'teacher') && (
            <div className={styles.navLinks}>
              <Link href="/bank" className={styles.bankButton}>
                Question Bank
              </Link>
            </div>
          )}
          <div className={styles.userSection}>
            <ProfileDropdown />
          </div>
        </div>
      </div>
    </nav>
  );
}