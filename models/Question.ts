import { ObjectId } from 'mongodb';

export interface TrackedQuestion {
  question: Question | null;
  status: 'success' | 'failed' | 'unsure';
  timestamp: number;
  attempts: number;
  isPdfQuestionSet?: boolean;
}

interface TextContent {
  type: 'text';
  content: string;
}

interface MathContent {
  type: 'math';
  content: string;
  block?: boolean;
}

interface ListContent {
  type: 'list';
  content: ContentPart[];
}

type ContentPart = TextContent | MathContent | ListContent;

export interface Question {
  _id: string | ObjectId;
  subject: string;
  topic: string;
  question: string;
  solution: string;
  difficulty_level: string;
  class: string;
  education_board?: string;
  // For PDF question sets
  question_pdf_blob?: string;
  solution_pdf_blob?: string;
  label?: string;
  // Add any other fields used in your application
}