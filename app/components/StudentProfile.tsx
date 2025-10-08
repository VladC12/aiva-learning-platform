import styles from './StudentProfile.module.css'
import { UserData } from 'context/UserContext';
import QuestionList from './QuestionList';
import QuestionHistory from './QuestionHistory';

interface Props {
    user: UserData;
}

const StudentProfile: React.FC<Props> = ({ user }) => {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>My Profile</h1>
            </div>

            <div className={styles.profileGrid}>
                <div className={styles.infoCard}>
                    <h2>Personal Information</h2>
                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Username:</span>
                        <span className={styles.infoValue}>{user.username}</span>
                    </div>
                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Email:</span>
                        <span className={styles.infoValue}>{user.email_address}</span>
                    </div>
                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Name:</span>
                        <span className={styles.infoValue}>{user.first_name} {user.middle_name ? `${user.middle_name} ` : ''}{user.last_name}</span>
                    </div>
                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Education Board:</span>
                        <span className={styles.infoValue}>{user.education_board}</span>
                    </div>
                    {user.country_of_residence && (
                        <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>Country:</span>
                            <span className={styles.infoValue}>{user.country_of_residence}</span>
                        </div>
                    )}
                </div>

                <div className={styles.statsCard}>
                    <h2>Learning Progress</h2>
                    <div className={styles.statsGrid}>
                        <div className={styles.statItem}>
                            <div className={styles.statValue}>
                                {Object.keys(user.question_tracking || {}).length}
                            </div>
                            <div className={styles.statLabel}>Questions Attempted</div>
                        </div>
                        <div className={styles.statItem}>
                            <div className={styles.statValue}>
                                {Object.values(user.question_tracking || {}).filter(q => q.status === 'success').length}
                            </div>
                            <div className={styles.statLabel}>Successful</div>
                        </div>
                        <div className={styles.statItem}>
                            <div className={styles.statValue}>
                                {Object.values(user.question_tracking || {}).filter(q => q.status === 'unsure').length}
                            </div>
                            <div className={styles.statLabel}>Unsure</div>
                        </div>
                        <div className={styles.statItem}>
                            <div className={styles.statValue}>
                                {Object.values(user.question_tracking || {}).filter(q => q.status === 'failed').length}
                            </div>
                            <div className={styles.statLabel}>Need Practice</div>
                        </div>
                    </div>
                </div>
            </div>
            <QuestionHistory user={user} />
            {/* Add Question Sets section for students with a room */}
            {user?.room && (
                <div className={styles.roomQuestionSets}>
                    <QuestionList
                        roomId={user.room}
                        filterByRoom={true}
                        title="Class Question Sets"
                    />
                </div>
            )}

        </div>
    );
}

export default StudentProfile;