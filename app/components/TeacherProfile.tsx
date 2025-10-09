import styles from './TeacherProfile.module.css'
import Link from 'next/link'
import { UserData } from "context/UserContext"
import { useEffect, useState } from "react"
import QuestionList from './QuestionList'
import QuestionSetPerformance from './QuestionSetPerformance'

interface Props {
  user: UserData
}

interface Student extends UserData {
  totalQuestions: number;
  successQuestions: number;
  failedQuestions: number;
  unsureQuestions: number;
}

interface Room {
  _id: string;
  students: Student[];
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalPages: number;
}

const TeacherProfile: React.FC<Props> = ({user}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    totalPages: 1
  });
  const [displayedStudents, setDisplayedStudents] = useState<Student[]>([]);

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        if (!user?._id || !user?.room) {
          setLoading(false);
          return;
        }

        // Fetch the room data with student information
        const response = await fetch(`/api/rooms/${user.room}`);
        if (!response.ok) {
          throw new Error('Failed to fetch room data');
        }

        const data = await response.json();
        setRoom(data.room);

        // Calculate total pages
        const totalPages = Math.ceil(data.room.students.length / pagination.limit);
        setPagination(prev => ({ ...prev, totalPages }));
      } catch (error) {
        console.error('Error fetching room data:', error);
        setError('Failed to load student data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchRoomData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Update displayed students when pagination or room data changes
  useEffect(() => {
    if (room?.students) {
      const startIndex = (pagination.page - 1) * pagination.limit;
      const endIndex = startIndex + pagination.limit;
      setDisplayedStudents(room.students.slice(startIndex, endIndex));
    }
  }, [pagination.page, pagination.limit, room?.students]);

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Teacher Dashboard</h1>
      </div>
      
      <div className={styles.profileGrid}>
        <div className={styles.infoCard}>
          <h2>Teacher Information</h2>
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
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Room ID:</span>
            <span className={styles.infoValue}>{user.room}</span>
          </div>
        </div>

        <div className={styles.statsCard}>
          <h2>Classroom Overview</h2>
          {loading ? (
            <div className={styles.loading}>Loading classroom data...</div>
          ) : error ? (
            <div className={styles.error}>{error}</div>
          ) : !room ? (
            <div className={styles.emptyState}>
              <p>No classroom data available.</p>
            </div>
          ) : (
            <div className={styles.classStats}>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{room.students.length}</div>
                <div className={styles.statLabel}>Total Students</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statValue}>
                  {room.students.reduce((sum, student) => sum + (student.totalQuestions || 0), 0)}
                </div>
                <div className={styles.statLabel}>Total Questions Attempted</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statValue}>
                  {Math.round(room.students.reduce((sum, student) => 
                    sum + (student.successQuestions || 0), 0) / 
                    room.students.reduce((sum, student) => sum + (student.totalQuestions || 0), 1) * 100) || 0}%
                </div>
                <div className={styles.statLabel}>Success Rate</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Question Set Performance Overview */}
      {user?.room && (
        <QuestionSetPerformance roomId={user.room} />
      )}

      {/* Add Question Sets section */}
      {user?.room && (
        <div className={styles.questionSetsSection}>
          <QuestionList 
            roomId={user.room} 
            filterByRoom={true} 
            title="Room Question Sets"
          />
        </div>
      )}

      <div className={styles.studentsSection}>
        <h2>Students Performance</h2>
        {loading ? (
          <div className={styles.loading}>Loading student data...</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : !room || room.students.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No students in this classroom yet.</p>
          </div>
        ) : (
          <>
            <div className={styles.studentsTable}>
              <div className={styles.tableHeader}>
                <div className={styles.nameColumn}>Student Name</div>
                <div className={styles.statsColumn}>Questions Attempted</div>
                <div className={styles.statsColumn}>Success</div>
                <div className={styles.statsColumn}>Failed</div>
                <div className={styles.statsColumn}>Unsure</div>
                <div className={styles.actionsColumn}>Actions</div>
              </div>
              
              {displayedStudents.map((student) => (
                <div key={student._id} className={styles.studentRow}>
                  <div className={styles.nameColumn}>
                    {student.first_name} {student.last_name}
                  </div>
                  <div className={styles.statsColumn}>{student.totalQuestions || 0}</div>
                  <div className={styles.statsColumn}>
                    <span className={styles.successText}>{student.successQuestions || 0}</span>
                  </div>
                  <div className={styles.statsColumn}>
                    <span className={styles.failedText}>{student.failedQuestions || 0}</span>
                  </div>
                  <div className={styles.statsColumn}>
                    <span className={styles.unsureText}>{student.unsureQuestions || 0}</span>
                  </div>
                  <div className={styles.actionsColumn}>
                    <Link href={`/student/${student._id}`} className={styles.viewButton}>
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination controls */}
            <div className={styles.paginationControls}>
              <button 
                className={styles.paginationButton}
                disabled={pagination.page <= 1}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                Previous
              </button>
              <span className={styles.pageInfo}>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button 
                className={styles.paginationButton}
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default TeacherProfile