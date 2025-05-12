import { Db, Collection, ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Add question tracking interfaces
interface QuestionStatus {
  status: 'success' | 'failed' | 'unsure';
  timestamp: number;
  attempts?: number;
}

interface QuestionTracking {
  [questionId: string]: QuestionStatus;
}

interface User {
  _id?: ObjectId;
  username: string;
  email_address: string;
  password: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  education_board: string;
  type?: 'student' | 'teacher';
  country_of_residence?: string;
  birthdate?: string;
  profile_picture?: string;
  question_tracking?: QuestionTracking;
  room?: ObjectId;
}

class UserModel {
  private collection: Collection<User>;

  constructor(db: Db) {
    this.collection = db.collection<User>('Users');
  }

  async createUser(userData: Omit<User, 'password'> & { password: string }) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = {
      ...userData,
      password: hashedPassword
    };
    await this.collection.insertOne(user);
    return user;
  }

  async findUserByEmail(email: string) {
    return this.collection.findOne({ email_address: email });
  }

  async findUserById(userId: string) {
    return this.collection.findOne({ _id: new ObjectId(userId) });
  }

  async updateUser(userId: string, updateData: any) {
    return this.collection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );
  }

  async findUserByResetToken(token: string) {
    return this.collection.findOne({
      password_reset_token: token,
      password_reset_expiry: { $gt: Date.now() }
    });
  }

  async updatePassword(userId: string, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return this.collection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: { password: hashedPassword },
        $unset: {
          password_reset_token: "",
          password_reset_expiry: ""
        }
      }
    );
  }

  async validatePassword(email: string, password: string) {
    const user = await this.findUserByEmail(email);
    if (!user) return false;

    // Use bcrypt.compare as a Promise
    return await bcrypt.compare(password, user.password);
  }


  // New method for tracking question status
  async trackQuestion(userId: string, questionId: string, status: 'success' | 'failed' | 'unsure') {
    const questionStatus: QuestionStatus = {
      status,
      timestamp: Date.now()
    };

    // Find the user to check if they have existing tracking data for this question
    const user = await this.findUserById(userId);

    if (user?.question_tracking?.[questionId]) {
      // Increment attempts if the question has been attempted before
      questionStatus.attempts = (user.question_tracking[questionId].attempts || 1) + 1;
    } else {
      // First attempt
      questionStatus.attempts = 1;
    }

    // Update the question tracking field
    return this.collection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          [`question_tracking.${questionId}`]: questionStatus
        }
      }
    );
  }

  // Get all tracked questions for a user
  async getTrackedQuestions(userId: string) {
    const user = await this.findUserById(userId);
    return user?.question_tracking || {};
  }

  generateToken(user: User) {
    return jwt.sign(
      { userId: user._id, email: user.email_address },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );
  }
}

export default UserModel;