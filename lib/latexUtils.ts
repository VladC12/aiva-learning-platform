export function parseLatexContent(latexText: string): { type: 'text' | 'math', content: string }[] {
  // Regex to detect math blocks ($$, \[ \]), inline math ($), or any LaTeX math environment
  const mathRegex = /(\$\$(?:[^$]|\n)*?\$\$|\$(?:[^$]|\n)*?\$|\\\[(?:[^\]]|\n)*?\\\]|\\begin\{[^}]*?\}(?:[^\\]|\n)*?\\end\{[^}]*?\})/g;

  // Split the text into parts: math and non-math
  const parts = latexText.split(mathRegex).filter(part => part.trim() !== '');

  // Categorize each part as math or text
  return parts.map(part => {
    const isMath = part.match(mathRegex);
    return {
      type: isMath ? 'math' : 'text',
      content: part,
    };
  });
};
