import { Db, Collection, ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

interface User {
  username: string;
  email_address: string;
  password: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  education_board: string;
  type?: string;
  country_of_residence?: string;
  birthdate?: string;
  profile_picture?: string;
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

  generateToken(user: User) {
    return jwt.sign(
      { userId: user.username, email: user.email_address },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );
  }
}

export default UserModel;