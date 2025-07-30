import { Question } from '@/models/Question';
import { renderKatex, getKatexStyles } from './katexUtils';

/**
 * Creates a container element for the PDF document
 */
export function createContainer(): HTMLDivElement {
  const container = document.createElement('div');
  container.style.width = '210mm'; // A4 width
  container.style.padding = '20mm 20mm'; // Standard margins
  container.style.fontFamily = 'Arial, sans-serif';
  container.style.backgroundColor = 'white';
  container.style.color = 'black';
  container.style.boxSizing = 'border-box';
  container.style.lineHeight = '1.4';
  
  // Add KaTeX CSS styles to improve rendering
  const style = document.createElement('style');
  style.textContent = getKatexStyles();
  container.appendChild(style);
  
  return container;
}

/**
 * Creates a title element for the PDF
 */
export function createTitleElement(title: string): HTMLHeadingElement {
  const titleElement = document.createElement('h1');
  titleElement.textContent = title;
  titleElement.style.textAlign = 'center';
  titleElement.style.marginBottom = '30px';
  titleElement.style.fontSize = '24px';
  titleElement.style.paddingBottom = '10px';
  titleElement.style.pageBreakAfter = 'avoid';
  return titleElement;
}

/**
 * Creates a question container element
 */
export function createQuestionContainer(question: Question, index: number, includeSolutions: boolean, includeReviewSection: boolean): HTMLDivElement {
  // Create a question container to keep question and solution together
  const questionContainer = document.createElement('div');
  questionContainer.className = 'question-container';
  questionContainer.dataset.questionIndex = index.toString();
  questionContainer.style.marginTop = '25px';
  questionContainer.style.marginBottom = '25px';
  questionContainer.style.pageBreakInside = 'avoid';
  questionContainer.style.breakInside = 'avoid';
  
  // Add question header
  questionContainer.appendChild(createQuestionHeader(question, index));
  
  // Add question content
  questionContainer.appendChild(createQuestionContent(question));
  
  // Add solution if requested
  if (includeSolutions) {
    questionContainer.appendChild(createSolutionHeader());
    questionContainer.appendChild(createSolutionContent(question));
    
    // Add review section if requested
    if (includeReviewSection) {
      questionContainer.appendChild(createReviewSection());
    }
  }
  
  return questionContainer;
}

/**
 * Creates a question header element
 */
function createQuestionHeader(question: Question, index: number): HTMLHeadingElement {
  const questionHeader = document.createElement('h2');
  let headerText = `Question ${index + 1}`;
  if (question.q_number) {
    headerText += ` (ID: ${question.q_number})`;
  }
  questionHeader.textContent = headerText;
  questionHeader.style.marginTop = '0';
  questionHeader.style.marginBottom = '15px';
  questionHeader.style.fontSize = '18px';
  questionHeader.style.pageBreakAfter = 'avoid';
  return questionHeader;
}

/**
 * Creates a question content element
 */
function createQuestionContent(question: Question): HTMLDivElement {
  const questionContent = document.createElement('div');
  questionContent.className = 'question-content';
  questionContent.innerHTML = renderKatex(question.question);
  questionContent.style.marginBottom = '15px';
  questionContent.style.lineHeight = '1.5';
  return questionContent;
}

/**
 * Creates a solution header element
 */
function createSolutionHeader(): HTMLHeadingElement {
  const solutionHeader = document.createElement('h3');
  solutionHeader.textContent = 'Solution:';
  solutionHeader.style.marginTop = '15px';
  solutionHeader.style.fontSize = '16px';
  solutionHeader.style.pageBreakAfter = 'avoid';
  return solutionHeader;
}

/**
 * Creates a solution content element
 */
function createSolutionContent(question: Question): HTMLDivElement {
  const solutionContent = document.createElement('div');
  solutionContent.className = 'solution-content';
  solutionContent.innerHTML = renderKatex(question.solution);
  solutionContent.style.marginBottom = '20px';
  solutionContent.style.lineHeight = '1.5';
  return solutionContent;
}

/**
 * Creates a divider element
 */
export function createDivider(): HTMLHRElement {
  const divider = document.createElement('hr');
  divider.style.margin = '25px 0';
  divider.style.border = 'none';
  divider.style.borderTop = '1px solid #ddd';
  divider.style.pageBreakAfter = 'avoid';
  return divider;
}

/**
 * Creates a review section element
 */
function createReviewSection(): HTMLDivElement {
  // Create a container for the feedback section
  const feedbackSection = document.createElement('div');
  feedbackSection.className = 'feedback-section';
  feedbackSection.style.marginTop = '30px';
  feedbackSection.style.marginBottom = '30px';
  feedbackSection.style.border = '1px solid #ddd';
  feedbackSection.style.padding = '15px';
  feedbackSection.style.pageBreakInside = 'avoid';
  
  // Add a header for the feedback section
  const feedbackHeader = document.createElement('h3');
  feedbackHeader.textContent = 'Reviewer Feedback';
  feedbackHeader.style.fontSize = '16px';
  feedbackHeader.style.marginTop = '0';
  feedbackHeader.style.marginBottom = '15px';
  feedbackSection.appendChild(feedbackHeader);
  
  // Add question type by difficulty table
  feedbackSection.appendChild(createReviewTable());
  
  // Add approval/rejection section
  feedbackSection.appendChild(createApprovalSection());
  
  // Add comments section
  feedbackSection.appendChild(createCommentsSection());
  
  return feedbackSection;
}

/**
 * Creates a review table element
 */
function createReviewTable(): HTMLTableElement {
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
  return table;
}

/**
 * Creates an approval section element
 */
function createApprovalSection(): HTMLDivElement {
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
  
  return approvalSection;
}

/**
 * Creates a comments section element
 */
function createCommentsSection(): HTMLDivElement {
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
  return commentsSection;
}
