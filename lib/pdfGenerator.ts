import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { saveAs } from 'file-saver';
import { Question } from '@/models/Question';
import katex from 'katex';

/**
 * Converts KaTeX expressions to plain text for PDF
 * @param text Text possibly containing KaTeX expressions
 * @returns Text with KaTeX expressions processed
 */
export function processKatexForPdf(text: string): string {
  if (!text) return '';
  
  try {
    // Replace inline math: $...$ with rendered text
    let processedText = text.replace(/\$([^\$]+)\$/g, (match, formula) => {
      try {
        // We can't render actual KaTeX in PDF directly, but we can at least
        // clean it up to make it more readable
        return ` [Math: ${formula.trim()}] `;
      } catch (err) {
        console.error('Error processing inline KaTeX:', err);
        return match; // Return original if there's an error
      }
    });

    // Replace block math: $$...$$ with rendered text
    processedText = processedText.replace(/\$\$([^\$]+)\$\$/g, (match, formula) => {
      try {
        return `\n\n[Math Expression: ${formula.trim()}]\n\n`;
      } catch (err) {
        console.error('Error processing block KaTeX:', err);
        return match; // Return original if there's an error
      }
    });

    return processedText;
  } catch (err) {
    console.error('Error in processKatexForPdf:', err);
    return text; // Return original text if something goes wrong
  }
}

/**
 * Generates a PDF document from a list of questions
 */
export async function generateQuestionPDF(
  questions: Question[], 
  title: string = 'Question Set', 
  includeSolutions: boolean = false
) {
  // Create a new document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          ...questions.flatMap((question, index) => {
            // Process question text to handle KaTeX
            const questionText = processKatexForPdf(question.question);
            
            const paragraphs = [
              new Paragraph({
                text: `Question ${index + 1}`,
                heading: HeadingLevel.HEADING_2,
                spacing: {
                  before: 400,
                  after: 200,
                },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${questionText}`,
                    size: 24,
                  }),
                ],
                spacing: {
                  after: 200,
                },
              }),
            ];

            // Add metadata as small text
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Class: ${question.class} | Subject: ${question.subject} | Topic: ${question.topic} | Difficulty: ${question.difficulty_level}`,
                    size: 20,
                    italics: true,
                  }),
                ],
                spacing: {
                  after: 400,
                },
              })
            );

            // Add solution if requested
            if (includeSolutions) {
              // Process solution text to handle KaTeX
              const solutionText = processKatexForPdf(question.solution);
              
              paragraphs.push(
                new Paragraph({
                  text: "Solution:",
                  heading: HeadingLevel.HEADING_3,
                  spacing: {
                    before: 200,
                    after: 200,
                  },
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${solutionText}`,
                      size: 24,
                    }),
                  ],
                  spacing: {
                    after: 400,
                  },
                })
              );
            }

            return paragraphs;
          }),
        ],
      },
    ],
  });

  return doc;
}

/**
 * Downloads a PDF document
 */
export async function downloadPDF(doc: Document, filename: string) {
  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
}