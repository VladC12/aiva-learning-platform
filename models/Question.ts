import { ObjectId } from 'mongodb';

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
  topic: string;
  subject: string;
  diagram_text_latex: string;
  question_pdf_blob: string;
  solution_pdf_blob: string;
}