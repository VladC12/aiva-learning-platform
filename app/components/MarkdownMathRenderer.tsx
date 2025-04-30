import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

import styles from './MarkdownMathRenderer.module.css'
import 'katex/dist/katex.min.css';

const MarkdownMathRenderer = ({ content }: { content: string }) => {
  return (
    <div className={styles.wrapper}>
      <ReactMarkdown
        children={content}
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
      />
    </div>
  );
};

export default MarkdownMathRenderer;