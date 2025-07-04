import { Question } from '@/models/Question';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * Renders KaTeX expressions in HTML
 * @param text Text with KaTeX expressions
 * @returns HTML with rendered KaTeX
 */
function renderKatex(text: string): string {
  if (!text) return '';
  
  try {
    // Replace block math expressions: $$...$$
    let html = text.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
      try {
        return `<div class="katex-block">${katex.renderToString(formula.trim(), {
          displayMode: true,
          throwOnError: false
        })}</div>`;
      } catch (err) {
        console.error('Error rendering block KaTeX:', err);
        return `<div class="katex-error">Failed to render: ${formula}</div>`;
      }
    });

    // Replace inline math expressions: $...$
    html = html.replace(/\$(.*?)\$/g, (match, formula) => {
      try {
        return katex.renderToString(formula.trim(), {
          displayMode: false,
          throwOnError: false
        });
      } catch (err) {
        console.error('Error rendering inline KaTeX:', err);
        return `<span class="katex-error">Failed to render: ${formula}</span>`;
      }
    });

    return html;
  } catch (err) {
    console.error('Error in renderKatex:', err);
    return text;
  }
}

/**
 * Creates a temporary HTML document with the questions and solutions
 */
function createHtmlDocument(
  questions: Question[],
  title: string,
  includeSolutions: boolean
): HTMLElement {
  // Create a container div
  const container = document.createElement('div');
  container.style.width = '210mm'; // A4 width
  container.style.padding = '20mm 20mm'; // Standard margins
  container.style.fontFamily = 'Arial, sans-serif';
  container.style.backgroundColor = 'white';
  container.style.color = 'black';
  container.style.boxSizing = 'border-box';
  
  // Add title
  const titleElement = document.createElement('h1');
  titleElement.textContent = title;
  titleElement.style.textAlign = 'center';
  titleElement.style.marginBottom = '20px';
  titleElement.style.fontSize = '24px';
  container.appendChild(titleElement);
  
  // Add questions
  questions.forEach((question, index) => {
    // Create a question container to keep question and solution together
    const questionContainer = document.createElement('div');
    questionContainer.className = 'question-container';
    questionContainer.dataset.questionIndex = index.toString();
    // Don't force page breaks - we'll handle that during PDF generation
    questionContainer.style.marginTop = '25px';
    questionContainer.style.marginBottom = '25px';
    
    // Question header
    const questionHeader = document.createElement('h2');
    questionHeader.textContent = `Question ${index + 1}`;
    questionHeader.style.marginTop = '0';
    questionHeader.style.marginBottom = '15px';
    questionHeader.style.fontSize = '18px';
    questionContainer.appendChild(questionHeader);
    
    // Question content with KaTeX rendering
    const questionContent = document.createElement('div');
    questionContent.className = 'question-content';
    questionContent.innerHTML = renderKatex(question.question);
    questionContent.style.marginBottom = '15px';
    questionContainer.appendChild(questionContent);
    
    // Question metadata
    const metadata = document.createElement('div');
    metadata.style.fontSize = '12px';
    metadata.style.color = '#666';
    metadata.style.fontStyle = 'italic';
    metadata.style.marginBottom = '15px';
    metadata.textContent = `Class: ${question.class} | Subject: ${question.subject} | Topic: ${question.topic} | Difficulty: ${question.difficulty_level}`;
    questionContainer.appendChild(metadata);
    
    // Add solution if requested
    if (includeSolutions) {
      const solutionHeader = document.createElement('h3');
      solutionHeader.textContent = 'Solution:';
      solutionHeader.style.marginTop = '15px';
      solutionHeader.style.fontSize = '16px';
      questionContainer.appendChild(solutionHeader);
      
      const solutionContent = document.createElement('div');
      solutionContent.className = 'solution-content';
      solutionContent.innerHTML = renderKatex(question.solution);
      solutionContent.style.marginBottom = '20px';
      questionContainer.appendChild(solutionContent);
    }
    
    // Add the question container to the main container
    container.appendChild(questionContainer);
    
    // Add divider except for last question
    if (index < questions.length - 1) {
      const divider = document.createElement('hr');
      divider.style.margin = '25px 0';
      divider.style.border = 'none';
      divider.style.borderTop = '1px solid #ddd';
      container.appendChild(divider);
    }
  });
  
  return container;
}

/**
 * Generates a PDF using HTML with KaTeX support
 */
export async function generateQuestionPDF(
  questions: Question[],
  title: string,
  includeSolutions: boolean = false
): Promise<void> {
  // Create HTML document
  const container = createHtmlDocument(questions, title, includeSolutions);
  
  // Append to body temporarily (needed for html2canvas to work)
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  document.body.appendChild(container);
  
  try {
    // Initialize PDF with A4 size
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Get title element and question containers
    const titleElement = container.querySelector('h1');
    const questionContainers = Array.from(container.querySelectorAll('.question-container'));
    
    // First, add the title to the first page
    let yOffset = 20; // Start position from top
    
    if (titleElement) {
      const titleCanvas = await html2canvas(titleElement as HTMLElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: null
      });
      
      const imgWidth = pdfWidth - 40; // Add margin
      const imgHeight = (titleCanvas.height * imgWidth) / titleCanvas.width;
      
      const imgData = titleCanvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 20, yOffset, imgWidth, imgHeight);
      
      yOffset += imgHeight + 10; // Update Y position for next element
    }
    
    // Process each question container
    for (let i = 0; i < questionContainers.length; i++) {
      const questionContainer = questionContainers[i];
      
      // Generate canvas for this question container
      const canvas = await html2canvas(questionContainer as HTMLElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: null
      });
      
      // Calculate dimensions with proper aspect ratio
      const imgWidth = pdfWidth - 40; // Add margin
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Check if the question fits on the current page
      if (yOffset + imgHeight > pdfHeight - 20) {
        // Not enough space, add a new page
        pdf.addPage();
        yOffset = 20; // Reset Y position for new page
      }
      
      // Add image to PDF
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 20, yOffset, imgWidth, imgHeight);
      
      // Update Y position for next question
      yOffset += imgHeight + 15;
      
      // Add divider if not the last question
      if (i < questionContainers.length - 1) {
        // Check if we need a new page for the next question (estimate its size)
        const nextContainer = questionContainers[i + 1];
        const nextHeight = nextContainer.getBoundingClientRect().height;
        const estimatedNextImgHeight = (nextHeight * imgWidth) / nextContainer.getBoundingClientRect().width;
        
        // If divider + next question won't fit, don't add divider and start new page next
        if (yOffset + 5 + estimatedNextImgHeight > pdfHeight - 20) {
          // Next question won't fit, no need for divider
          continue;
        }
        
        // Add divider
        pdf.setDrawColor(221, 221, 221); // #ddd color
        pdf.line(20, yOffset, pdfWidth - 20, yOffset);
        yOffset += 15; // Space after divider
      }
    }
    
    // Save the PDF
    const filename = title.replace(/\s+/g, '_') + '.pdf';
    pdf.save(filename);
  } finally {
    // Clean up - remove the temporary element
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
}

/**
 * Downloads a PDF document
 */
export function downloadPDF(filename: string): void {
  // This function is just for API compatibility
  console.log(`PDF ${filename} downloaded`);
}