// @ts-ignore;
import React from 'react';
import { getRichTextDisplayHtml } from './richText';

export function RichTextContent({
  html,
  fallbackText = '',
  className = ''
}) {
  const content = React.useMemo(() => getRichTextDisplayHtml(html, fallbackText), [html, fallbackText]);

  if (!content) return null;

  return <>
      <style>{`
        .activity-rich-text {
          color: #374151;
          font-size: 14px;
          line-height: 1.8;
          word-break: break-word;
        }
        .activity-rich-text p,
        .activity-rich-text div,
        .activity-rich-text li,
        .activity-rich-text blockquote {
          line-height: 1.8;
        }
        .activity-rich-text img {
          display: block;
          max-width: 100%;
          height: auto;
          margin: 12px 0;
          border-radius: 12px;
        }
      `}</style>
      <div className={`activity-rich-text ${className}`.trim()} dangerouslySetInnerHTML={{
      __html: content
    }} />
    </>;
}
