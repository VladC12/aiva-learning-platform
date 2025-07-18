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
  includeSolutions: boolean,
  includeReviewSection: boolean = false
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
  titleElement.style.marginBottom = '30px'; // Increased margin to prevent cutoff
  titleElement.style.fontSize = '24px';
  titleElement.style.paddingBottom = '10px'; // Added padding to ensure text isn't cut off
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
    
    // Question header with internal ID if available
    const questionHeader = document.createElement('h2');
    let headerText = `Question ${index + 1}`;
    if (question.q_number) {
      headerText += ` (ID: ${question.q_number})`;
    }
    questionHeader.textContent = headerText;
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
      
      // Add feedback section for reviewers if requested
      if (includeReviewSection) {
        // Create a container for the feedback section
        const feedbackSection = document.createElement('div');
        feedbackSection.className = 'feedback-section';
        feedbackSection.style.marginTop = '30px';
        feedbackSection.style.marginBottom = '30px';
        feedbackSection.style.border = '1px solid #ddd';
        feedbackSection.style.padding = '15px';
        
        // Add a header for the feedback section
        const feedbackHeader = document.createElement('h3');
        feedbackHeader.textContent = 'Reviewer Feedback';
        feedbackHeader.style.fontSize = '16px';
        feedbackHeader.style.marginTop = '0';
        feedbackHeader.style.marginBottom = '15px';
        feedbackSection.appendChild(feedbackHeader);
        
        // Create the question type by difficulty table
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.marginBottom = '20px';
        
        // Create table header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        // Add empty cell for the top-left corner
        const cornerCell = document.createElement('th');
        cornerCell.style.border = '1px solid #ddd';
        cornerCell.style.padding = '8px';
        cornerCell.style.backgroundColor = '#f2f2f2';
        headerRow.appendChild(cornerCell);
        
        // Add question type headers
        const questionTypes = [
          'MCQ', 'Assertion-Reasoning', 'VSA', 'SA', 'LA', 'Case Study', 'Integrated'
        ];
        
        questionTypes.forEach(type => {
          const th = document.createElement('th');
          th.textContent = type;
          th.style.border = '1px solid #ddd';
          th.style.padding = '8px';
          th.style.backgroundColor = '#f2f2f2';
          headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Create table body
        const tbody = document.createElement('tbody');
        const difficultyLevels = ['Easy', 'Medium', 'Difficult/HOTS'];
        
        difficultyLevels.forEach(level => {
          const row = document.createElement('tr');
          
          // Add difficulty level in the first column
          const levelCell = document.createElement('td');
          levelCell.textContent = level;
          levelCell.style.border = '1px solid #ddd';
          levelCell.style.padding = '8px';
          levelCell.style.fontWeight = 'bold';
          levelCell.style.backgroundColor = '#f9f9f9';
          row.appendChild(levelCell);
          
          // Add checkbox cells for each question type
          questionTypes.forEach(() => {
            const cell = document.createElement('td');
            cell.style.border = '1px solid #ddd';
            cell.style.padding = '8px';
            cell.style.height = '30px';
            row.appendChild(cell);
          });
          
          tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        feedbackSection.appendChild(table);
        
        // Add approval/rejection section
        const approvalSection = document.createElement('div');
        approvalSection.style.marginBottom = '20px';
        approvalSection.style.marginTop = '20px';
        
        const approvalLabel = document.createElement('span');
        approvalLabel.textContent = 'Verdict: ';
        approvalLabel.style.fontWeight = 'bold';
        approvalSection.appendChild(approvalLabel);
        
        // Create a container for the checkboxes to align them properly
        const checkboxContainer = document.createElement('div');
        checkboxContainer.style.display = 'flex';
        checkboxContainer.style.alignItems = 'center';
        checkboxContainer.style.marginTop = '10px';
        
        // Approved checkbox
        const approvedCheckbox = document.createElement('div');
        approvedCheckbox.style.width = '20px';
        approvedCheckbox.style.height = '20px';
        approvedCheckbox.style.border = '2px solid #000';
        approvedCheckbox.style.marginRight = '8px';
        approvedCheckbox.style.display = 'inline-block';
        
        const approvedLabel = document.createElement('span');
        approvedLabel.textContent = 'Approved';
        approvedLabel.style.marginRight = '30px';
        
        // Add approved checkbox and label to container
        checkboxContainer.appendChild(approvedCheckbox);
        checkboxContainer.appendChild(approvedLabel);
        
        // Rejected checkbox
        const rejectedCheckbox = document.createElement('div');
        rejectedCheckbox.style.width = '20px';
        rejectedCheckbox.style.height = '20px';
        rejectedCheckbox.style.border = '2px solid #000';
        rejectedCheckbox.style.marginRight = '8px';
        rejectedCheckbox.style.display = 'inline-block';
        
        const rejectedLabel = document.createElement('span');
        rejectedLabel.textContent = 'Rejected';
        
        // Add rejected checkbox and label to container
        checkboxContainer.appendChild(rejectedCheckbox);
        checkboxContainer.appendChild(rejectedLabel);
        
        // Add the checkbox container to the approval section
        approvalSection.appendChild(checkboxContainer);
        feedbackSection.appendChild(approvalSection);
        
        // Add comments section
        const commentsSection = document.createElement('div');
        commentsSection.style.marginBottom = '10px';
        
        const commentsLabel = document.createElement('div');
        commentsLabel.textContent = 'Additional Comments:';
        commentsLabel.style.fontWeight = 'bold';
        commentsLabel.style.marginBottom = '5px';
        commentsSection.appendChild(commentsLabel);
        
        // Add lines for comments
        const commentsLines = document.createElement('div');
        commentsLines.style.width = '100%';
        commentsLines.style.height = '80px';
        commentsLines.style.borderBottom = '1px solid #000';
        commentsLines.style.borderTop = '1px solid #000';
        commentsLines.style.position = 'relative';
        
        // Add multiple lines inside the comment box
        for (let i = 1; i < 4; i++) {
          const line = document.createElement('div');
          line.style.position = 'absolute';
          line.style.left = '0';
          line.style.right = '0';
          line.style.top = `${i * 20}px`;
          line.style.borderBottom = '1px solid #eee';
          commentsLines.appendChild(line);
        }
        
        commentsSection.appendChild(commentsLines);
        feedbackSection.appendChild(commentsSection);
        
        // Add the feedback section to the question container
        questionContainer.appendChild(feedbackSection);
      }
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
  includeSolutions: boolean = false,
  includeReviewSection: boolean = false
): Promise<void> {
  // Create HTML document
  const container = createHtmlDocument(questions, title, includeSolutions, includeReviewSection);
  
  // Append to body temporarily (needed for html2canvas to work)
  // Position off-screen but do not hide with visibility:hidden as it breaks html2canvas
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.opacity = '1'; // Ensure it's rendered but not visible
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
        backgroundColor: null,
        allowTaint: true,
        foreignObjectRendering: false
      });
      
      const imgWidth = pdfWidth - 40; // Add margin
      const imgHeight = (titleCanvas.height * imgWidth) / titleCanvas.width;
      
      // Add extra bottom padding to prevent text cutoff
      const imgData = titleCanvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 20, yOffset, imgWidth, imgHeight + 5); // Added 5mm padding
      
      yOffset += imgHeight + 15; // Increased padding after title
    }
    
    // Process each question container
    for (let i = 0; i < questionContainers.length; i++) {
      const questionContainer = questionContainers[i];
      
      // Generate canvas for this question container
      const canvas = await html2canvas(questionContainer as HTMLElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: null,
        allowTaint: true, // Allow cross-origin images
        foreignObjectRendering: false // Better compatibility
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
    
    // Process complete, now add watermark under the content by going back to each page
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      
      // Save graphic state to restore later (ensures watermark appears under content)
      pdf.saveGraphicsState();
      
      // Set transparency for the watermark to ensure it's below the content
      // Create GState object properly with the jsPDF API
      const pdfWithGState = pdf as jsPDF & { GState: new (config: { opacity: number }) => unknown };
      const gState = new pdfWithGState.GState({ opacity: 0.1 });
      pdf.setGState(gState);
      
      // Add aiva.vision watermark
      pdf.setFontSize(30);  // Larger font since it's behind content
      pdf.setTextColor(150, 150, 150); // Light gray for subtlety
      pdf.setFont('helvetica', 'italic');
      
      // Position watermark in center diagonally
      const watermarkText = 'aiva.vision';
      const textWidth = pdf.getTextWidth(watermarkText);
      
      // Draw diagonal watermark across the center of the page (appears under content due to opacity)
      pdf.text(watermarkText, pdfWidth / 2 - textWidth / 2, pdfHeight / 2, {
        angle: -45
      });
      
      // Restore graphic state for normal opacity
      pdf.restoreGraphicsState();
      
      // Add "In Development" banner at top of each page
      pdf.setFontSize(10);
      pdf.setTextColor(150, 150, 150);
      pdf.setFont('helvetica', 'bold');
      pdf.text('IN DEVELOPMENT', 20, 10);
      
      // Add footer with app name
      pdf.setFontSize(10);
      pdf.setTextColor(150, 150, 150);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Generated by aiva.vision', pdfWidth - 100, pdfHeight - 10);
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
