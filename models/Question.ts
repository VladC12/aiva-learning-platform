import { ObjectId } from 'mongodb';

export interface TrackedQuestion {
  question: Question | null;
  status: 'success' | 'failed' | 'unsure';
  timestamp: number;
  attempts: number;
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
  _id: ObjectId;
  difficulty_level: string;
  education_board: string;
  class: string;
  topic: string;
  subject: string;
  question: string;
  solution: string;
}