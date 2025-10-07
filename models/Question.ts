import { ObjectId } from 'mongodb';

export interface QuestionQuery {
  education_board?: string;
  class?: string;
  subject?: string;
  topic?: { $in: string[] };
  difficulty_level?: { $in: string[] };
  q_type?: { $in: string[] };
  q_number?: number | { $eq: number };
  inCourse?: boolean | { $ne: undefined };
  isHOTS?: boolean | { $ne: undefined };
  isCorrect?: boolean | { $ne: undefined };
  DPS_approved?: boolean | { $ne: undefined };
  $or?: Array<Record<string, any>>;
  $and?: Array<Record<string, any>>;
}

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
  education_board?: string;
  class: string;
  subject: string;
  topic: string;
  question: string;
  solution: string;
  difficulty_level: string;
  question_pdf_blob?: string;
  solution_pdf_blob?: string;
  label?: string;
  q_number?: number;
  inCourse?: boolean;
  isHOTS?: boolean;
  isCorrect?: boolean;
  DPS_approved?: boolean;
  q_type?: string;
  reviewer_note?: string;
  // Moderator fields
  modDifficulty_level?: string;
  modInCourse?: boolean;
  modIsHOTS?: boolean;
  modIsCorrect?: boolean;
  modQ_type?: string;
}

export interface FilterOption {
  _id: string;
  content: string[];
  label: string;
  key: string;
  parent?: string; // Add parent field to indicate which education board this filter belongs to
}

export interface FilterState {
  education_board: string;
  class: string;
  subject: string;
  topic: string[];
  difficulty_level: string[];
  inCourse: string[];
  isHOTS: string[];
  isCorrect: string[];
  q_type: string[];
  q_number: string;
  DPS_approved: string[];
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}