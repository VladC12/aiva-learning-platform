import { Question } from '@/models/Question';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { renderKatex } from './pdf_generator/katexUtils';
import { 
  splitCanvasToPages, 
  addPdfMetadata,
  downloadPDF 
} from './pdf_generator/pdfUtils';
import {
  createContainer,
  createTitleElement,
  createQuestionContainer,
  createDivider
} from './pdf_generator/htmlComponents';

/**
 * Creates a temporary HTML document with the questions and solutions
 */
function createHtmlDocument(
  questions: Question[],
  title: string,
  includeSolutions: boolean,
  includeReviewSection: boolean = false
): HTMLElement {
  // Create a container div
  const container = createContainer();
  
  // Add title
  const titleElement = createTitleElement(title);
  container.appendChild(titleElement);
  
  // Add questions
  questions.forEach((question, index) => {
    // Create question container
    const questionContainer = createQuestionContainer(
      question, 
      index, 
      includeSolutions, 
      includeReviewSection
    );
    
    // Add the question container to the main container
    container.appendChild(questionContainer);
    
    // Add divider except for last question
    if (index < questions.length - 1) {
      container.appendChild(createDivider());
    }
  });
  
  return container;
}

/**
 * Generates a PDF using HTML with KaTeX support and improved page handling
 */
export async function generateQuestionPDF(
  questions: Question[],
  title: string,
  includeSolutions: boolean = false,
  includeReviewSection: boolean = false,
  onProgress?: (progress: number) => void
): Promise<void> {
  // Create HTML document
  const container = createHtmlDocument(questions, title, includeSolutions, includeReviewSection);
  
  // Append to body temporarily (needed for html2canvas to work)
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.opacity = '1';
  document.body.appendChild(container);
  
  // Wait a bit for KaTeX to fully render
  await new Promise(resolve => setTimeout(resolve, 100));
  
  try {
    // Initialize PDF with A4 size
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pdfWidth - 2 * margin;
    const contentHeight = pdfHeight - 2 * margin;
    
    // Convert mm to pixels for canvas height calculation (rough conversion)
    const maxCanvasHeight = Math.floor((contentHeight * 3.78)); // 1mm ≈ 3.78px at 96dpi
    
    // Get title element and question containers
    const titleElement = container.querySelector('h1');
    const questionContainers = Array.from(container.querySelectorAll('.question-container'));
    
    let currentPage = 1;
    let yOffset = margin;
    
    // First, add the title to the first page
    if (titleElement) {
      const titleCanvas = await renderElementToCanvas(titleElement as HTMLElement);
      
      const imgWidth = contentWidth;
      const imgHeight = (titleCanvas.height * imgWidth) / titleCanvas.width;
      
      const imgData = titleCanvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', margin, yOffset, imgWidth, imgHeight);
      
      yOffset += imgHeight + 15;
    }
    
    // Process each question container
    for (let i = 0; i < questionContainers.length; i++) {
      // Update progress
      if (onProgress) {
        const questionProgress = 10 + Math.round((i / questionContainers.length) * 70);
        onProgress(questionProgress);
      }
      
      const questionContainer = questionContainers[i];
      
      // Generate canvas for this question container with improved settings
      const canvas = await renderElementToCanvas(questionContainer as HTMLElement);
      
      // Calculate dimensions with proper aspect ratio
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Split the canvas if it's too tall for one page
      const canvasParts = splitCanvasToPages(canvas, maxCanvasHeight);
      
      for (let partIndex = 0; partIndex < canvasParts.length; partIndex++) {
        const partCanvas = canvasParts[partIndex];
        const partImgHeight = (partCanvas.height * imgWidth) / partCanvas.width;
        
        // Check if this part fits on the current page
        if (yOffset + partImgHeight > pdfHeight - margin) {
          // Not enough space, add a new page
          pdf.addPage();
          currentPage++;
          yOffset = margin;
        }
        
        // Add image part to PDF
        const partImgData = partCanvas.toDataURL('image/png');
        pdf.addImage(partImgData, 'PNG', margin, yOffset, imgWidth, partImgHeight);
        
        // Update Y position
        yOffset += partImgHeight + 10;
        
        // If this isn't the last part of the question, add some spacing
        if (partIndex < canvasParts.length - 1) {
          yOffset += 5;
        }
      }
      
      // Add space after the complete question
      yOffset += 10;
      
      // Add divider if not the last question and there's space
      if (i < questionContainers.length - 1) {
        if (yOffset + 20 > pdfHeight - margin) {
          // Start new page for divider
          pdf.addPage();
          currentPage++;
          yOffset = margin;
        } else {
          // Add divider on current page
          pdf.setDrawColor(221, 221, 221);
          pdf.line(margin, yOffset, pdfWidth - margin, yOffset);
          yOffset += 15;
        }
      }
    }
    
    // Add watermark and footers to all pages
    if (onProgress) {
      onProgress(80);
    }
    
    addPdfMetadata(pdf);
    
    // Save the PDF
    if (onProgress) {
      onProgress(95);
    }
    
    const filename = title.replace(/\s+/g, '_') + '.pdf';
    pdf.save(filename);
    
    if (onProgress) {
      onProgress(100);
    }
  } finally {
    // Clean up - remove the temporary element
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
}

/**
 * Renders an HTML element to a canvas
 */
async function renderElementToCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
  return await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: null,
    allowTaint: true,
    foreignObjectRendering: false,
    onclone: (clonedDoc) => {
      // Ensure KaTeX styles are applied to cloned document
      const clonedStyle = clonedDoc.createElement('style');
      clonedStyle.textContent = `
        .katex { 
          font-size: 1em !important; 
          vertical-align: baseline !important;
        }
        .katex-display { 
          margin: 10px 0 !important; 
          text-align: center !important;
        }
        .katex .base { 
          vertical-align: baseline !important; 
        }
        .katex .strut { 
          vertical-align: baseline !important; 
        }
        .katex-block {
          display: block !important;
          margin: 15px 0 !important;
          text-align: center !important;
        }
        .katex-inline {
          vertical-align: baseline !important;
          display: inline !important;
        }
      `;
      clonedDoc.head.appendChild(clonedStyle);
    }
  });
}

export { downloadPDF };