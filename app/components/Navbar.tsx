'use client';

import Link from "next/link";
import Image from "next/image";
import styles from './Navbar.module.css';
import ProfileDropdown from './ProfileDropdown';
import { useUser } from 'context/UserContext';

export default function Navbar() {
  const { user } = useUser();
  
  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <div className={styles.brand}>
          <Link href="/">
            <div className={styles.logoContainer}>
              <Image src="/aiva-logo.svg" alt="Aiva Logo" width={128} height={32} />
              <div className={styles.demoTextContainer}>
                <span className={styles.demoText}>Demo</span>
              </div>
            </div>
          </Link>
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