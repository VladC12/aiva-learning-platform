import { ObjectId } from 'mongodb';

export interface QuestionSet {
  _id: ObjectId;
  label: string;
  questions: string[];  // Array of question IDs as strings
}