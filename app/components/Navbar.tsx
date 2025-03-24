import Link from "next/link";
import styles from './Navbar.module.css';
import ProfileDropdown from './ProfileDropdown';

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <div className={styles.brand}>
          <Link href="/">Learning Platform</Link>
        </div>

        <div className={styles.navContent}>
          <div className={styles.links}>
            <Link href="/questions">Questions</Link>
          </div>
          <div className={styles.userSection}>
            <ProfileDropdown />
          </div>
        </div>
      </div>
    </nav>
  );
}