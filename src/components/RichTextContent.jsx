// @ts-ignore;
import React from 'react';
import {
  extractCloudRichTextImageIds,
  getRichTextDisplayHtml,
  replaceRichTextImageUrls
} from './richText';

export function RichTextContent({
  html,
  fallbackText = '',
  className = ''
}) {
  // 查看态优先展示富文本 HTML，旧数据只有纯文本时自动转换为段落结构。
  const content = React.useMemo(() => getRichTextDisplayHtml(html, fallbackText), [html, fallbackText]);
  const [resolvedContent, setResolvedContent] = React.useState(content);

  React.useEffect(() => {
    let cancelled = false;
    setResolvedContent(content);

    if (!content || typeof window === 'undefined') {
      return () => {
        cancelled = true;
      };
    }

    const cloudImageIds = extractCloudRichTextImageIds(content);
    if (cloudImageIds.length === 0) {
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      try {
        const tcb = await window.$w?.cloud?.getCloudInstance();
        if (!tcb) return;

        const result = await tcb.getTempFileURL({
          fileList: cloudImageIds
        });

        const urlMap = {};
        (result?.fileList || []).forEach((item) => {
          const fileID = String(item?.fileID || '').trim();
          const tempFileURL = String(item?.tempFileURL || '').trim();
          if (!fileID || !tempFileURL) return;
          urlMap[fileID] = tempFileURL;
        });

        if (cancelled || Object.keys(urlMap).length === 0) return;
        setResolvedContent(replaceRichTextImageUrls(content, urlMap));
      } catch (error) {
        console.error('解析富文本图片临时链接失败:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [content]);

  if (!resolvedContent) return null;

  return <>
      <style>{`
        .activity-rich-text {
          color: #374151;
          font-size: 14px;
          line-height: 1.8;
          word-break: break-word;
        }
        .activity-rich-text > *:first-child {
          margin-top: 0 !important;
        }
        .activity-rich-text > *:last-child {
          margin-bottom: 0 !important;
        }
        .activity-rich-text p,
        .activity-rich-text div,
        .activity-rich-text li,
        .activity-rich-text blockquote,
        .activity-rich-text h1,
        .activity-rich-text h2,
        .activity-rich-text h3 {
          line-height: 1.8;
        }
        .activity-rich-text h1 {
          margin: 0 0 14px;
          font-size: 24px;
          font-weight: 700;
          color: #111827;
        }
        .activity-rich-text h2 {
          margin: 0 0 14px;
          font-size: 20px;
          font-weight: 700;
          color: #111827;
        }
        .activity-rich-text h3 {
          margin: 0 0 12px;
          font-size: 18px;
          font-weight: 600;
          color: #111827;
        }
        .activity-rich-text ul,
        .activity-rich-text ol {
          margin: 0 0 12px;
          padding-left: 20px;
        }
        .activity-rich-text ul {
          list-style: disc;
        }
        .activity-rich-text ol {
          list-style: decimal;
        }
        .activity-rich-text li {
          margin-bottom: 8px;
        }
        .activity-rich-text blockquote {
          margin: 0 0 12px;
          padding: 8px 12px;
          border-left: 4px solid #d1d5db;
          background: #f9fafb;
          color: #4b5563;
        }
        .activity-rich-text a {
          color: #2563eb;
          text-decoration: underline;
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
      __html: resolvedContent
    }} />
    </>;
}
