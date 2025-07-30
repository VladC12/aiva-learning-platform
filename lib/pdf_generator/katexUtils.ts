import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * Renders KaTeX expressions in HTML with improved styling
 * @param text Text with KaTeX expressions
 * @returns HTML with rendered KaTeX
 */
export function renderKatex(text: string): string {
  if (!text) return '';
  
  try {
    // Replace block math expressions: $$...$$
    let html = text.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
      try {
        return `<div class="katex-block" style="margin: 10px 0; text-align: center; line-height: 1.2;">${katex.renderToString(formula.trim(), {
          displayMode: true,
          throwOnError: false,
          strict: false
        })}</div>`;
      } catch (err) {
        console.error('Error rendering block KaTeX:', err);
        return `<div class="katex-error" style="color: red; margin: 10px 0;">Failed to render: ${formula}</div>`;
      }
    });

    // Replace inline math expressions: $...$
    html = html.replace(/\$(.*?)\$/g, (match, formula) => {
      try {
        return `<span class="katex-inline" style="vertical-align: baseline;">${katex.renderToString(formula.trim(), {
          displayMode: false,
          throwOnError: false,
          strict: false
        })}</span>`;
      } catch (err) {
        console.error('Error rendering inline KaTeX:', err);
        return `<span class="katex-error" style="color: red;">Failed to render: ${formula}</span>`;
      }
    });

    return html;
  } catch (err) {
    console.error('Error in renderKatex:', err);
    return text;
  }
}

/**
 * Returns CSS styles for KaTeX rendering
 */
export function getKatexStyles(): string {
  return `
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
    .question-content, .solution-content {
      line-height: 1.5 !important;
    }
  `;
}
