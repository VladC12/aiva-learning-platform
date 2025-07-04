import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Question } from '@/models/Question';

// Add the necessary types for jsPDF-autotable
declare module 'jspdf' {
  interface jsPDF {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    autoTable: (options: any) => jsPDF;
  }
}

export const generateQuestionPDF = async (questions: Question[], title: string, includeSolutions: boolean = false) => {
  // Create a new PDF document
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(16);
  doc.text(title, 14, 20);
  
  // Add metadata
  doc.setFontSize(10);
  const dateStr = new Date().toLocaleDateString();
  doc.text(`Generated on: ${dateStr}`, 14, 30);
  doc.text(`Total Questions: ${questions.length}`, 14, 35);
  
  // Add questions
  questions.forEach((question, index) => {
    // Add new page if needed
    if (index > 0) {
      doc.addPage();
    }
    
    // Question number and metadata
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Question ${index + 1}`, 14, 45);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Topic: ${question.topic}`, 14, 52);
    doc.text(`Difficulty: ${question.difficulty_level}`, 14, 58);
    doc.text(`Type: ${question.q_type || 'Not specified'}`, 14, 64);
    
    // Question content
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Question:', 14, 74);
    
    doc.setFont('helvetica', 'normal');
    
    // Split long question text into multiple lines
    const questionLines = doc.splitTextToSize(question.question, 180);
    doc.text(questionLines, 14, 82);
    
    // Include solution if requested
    if (includeSolutions && question.solution) {
      // Calculate position for solution based on question text length
      const questionHeight = questionLines.length * 7; // Approximate height based on font size
      const solutionY = 82 + questionHeight + 15; // Add some spacing
      
      doc.setFont('helvetica', 'bold');
      doc.text('Solution:', 14, solutionY);
      
      doc.setFont('helvetica', 'normal');
      const solutionLines = doc.splitTextToSize(question.solution, 180);
      doc.text(solutionLines, 14, solutionY + 8);
    }
  });
  
  return doc;
};

export const downloadPDF = (doc: jsPDF, filename: string) => {
  doc.save(filename);
};