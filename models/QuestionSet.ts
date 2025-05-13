import { ObjectId } from 'mongodb';

export interface QuestionSet {
  _id: ObjectId | string;
  label: string;
  questions?: string[]; // Array of question IDs for regular question sets
  question_pdf_blob?: string; // PDF blob name for PDF question sets
  solution_pdf_blob?: string; // PDF blob name for PDF question sets
  created_at?: Date;
  updated_at?: Date;
}