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
        .activity-rich-text h3,
        .activity-rich-text h4,
        .activity-rich-text h5,
        .activity-rich-text h6 {
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
        .activity-rich-text h4,
        .activity-rich-text h5,
        .activity-rich-text h6 {
          margin: 0 0 10px;
          font-weight: 600;
          line-height: 1.5;
          color: #111827;
        }
        .activity-rich-text em,
        .activity-rich-text i {
          font-style: italic;
        }
        .activity-rich-text s,
        .activity-rich-text strike {
          text-decoration: line-through;
        }
        .activity-rich-text sub {
          vertical-align: sub;
          font-size: 75%;
        }
        .activity-rich-text sup {
          vertical-align: super;
          font-size: 75%;
        }
        .activity-rich-text code {
          border-radius: 4px;
          background: #f3f4f6;
          padding: 2px 4px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.9em;
        }
        .activity-rich-text pre {
          margin: 0 0 12px;
          border-radius: 8px;
          background: #111827;
          color: #f9fafb;
          padding: 12px;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .activity-rich-text pre code {
          background: transparent;
          color: inherit;
          padding: 0;
        }
        .activity-rich-text .ql-size-small {
          font-size: 0.75em;
        }
        .activity-rich-text .ql-size-large {
          font-size: 1.5em;
        }
        .activity-rich-text .ql-size-huge {
          font-size: 2.5em;
        }
        .activity-rich-text .ql-font-serif {
          font-family: Georgia, Times New Roman, serif;
        }
        .activity-rich-text .ql-font-monospace {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }
        .activity-rich-text .ql-color-white {
          color: #ffffff;
        }
        .activity-rich-text .ql-color-red {
          color: #e60000;
        }
        .activity-rich-text .ql-color-orange {
          color: #ff9900;
        }
        .activity-rich-text .ql-color-yellow {
          color: #ffff00;
        }
        .activity-rich-text .ql-color-green {
          color: #008a00;
        }
        .activity-rich-text .ql-color-blue {
          color: #0066cc;
        }
        .activity-rich-text .ql-color-purple {
          color: #9933ff;
        }
        .activity-rich-text .ql-bg-black {
          background-color: #000000;
        }
        .activity-rich-text .ql-bg-red {
          background-color: #e60000;
        }
        .activity-rich-text .ql-bg-orange {
          background-color: #ff9900;
        }
        .activity-rich-text .ql-bg-yellow {
          background-color: #ffff00;
        }
        .activity-rich-text .ql-bg-green {
          background-color: #008a00;
        }
        .activity-rich-text .ql-bg-blue {
          background-color: #0066cc;
        }
        .activity-rich-text .ql-bg-purple {
          background-color: #9933ff;
        }
        .activity-rich-text .ql-align-center {
          text-align: center;
        }
        .activity-rich-text .ql-align-right {
          text-align: right;
        }
        .activity-rich-text .ql-align-justify {
          text-align: justify;
        }
        .activity-rich-text .ql-direction-rtl {
          direction: rtl;
          text-align: inherit;
        }
        .activity-rich-text .ql-indent-1:not(.ql-direction-rtl) {
          padding-left: 3em;
        }
        .activity-rich-text .ql-indent-2:not(.ql-direction-rtl) {
          padding-left: 6em;
        }
        .activity-rich-text .ql-indent-3:not(.ql-direction-rtl) {
          padding-left: 9em;
        }
        .activity-rich-text .ql-indent-4:not(.ql-direction-rtl) {
          padding-left: 12em;
        }
        .activity-rich-text .ql-indent-5:not(.ql-direction-rtl) {
          padding-left: 15em;
        }
        .activity-rich-text .ql-indent-6:not(.ql-direction-rtl) {
          padding-left: 18em;
        }
        .activity-rich-text .ql-indent-7:not(.ql-direction-rtl) {
          padding-left: 21em;
        }
        .activity-rich-text .ql-indent-8:not(.ql-direction-rtl) {
          padding-left: 24em;
        }
        .activity-rich-text .ql-indent-9:not(.ql-direction-rtl) {
          padding-left: 27em;
        }
        .activity-rich-text .ql-direction-rtl.ql-indent-1 {
          padding-right: 3em;
        }
        .activity-rich-text .ql-direction-rtl.ql-indent-2 {
          padding-right: 6em;
        }
        .activity-rich-text .ql-direction-rtl.ql-indent-3 {
          padding-right: 9em;
        }
        .activity-rich-text .ql-direction-rtl.ql-indent-4 {
          padding-right: 12em;
        }
        .activity-rich-text .ql-direction-rtl.ql-indent-5 {
          padding-right: 15em;
        }
        .activity-rich-text .ql-direction-rtl.ql-indent-6 {
          padding-right: 18em;
        }
        .activity-rich-text .ql-direction-rtl.ql-indent-7 {
          padding-right: 21em;
        }
        .activity-rich-text .ql-direction-rtl.ql-indent-8 {
          padding-right: 24em;
        }
        .activity-rich-text .ql-direction-rtl.ql-indent-9 {
          padding-right: 27em;
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
        .activity-rich-text li[data-list="checked"],
        .activity-rich-text li[data-list="unchecked"] {
          list-style-type: none;
        }
        .activity-rich-text li[data-list="checked"]::before,
        .activity-rich-text li[data-list="unchecked"]::before {
          display: inline-block;
          width: 1.4em;
          margin-left: -1.4em;
          color: #4b5563;
        }
        .activity-rich-text li[data-list="checked"]::before {
          content: "\\2611";
        }
        .activity-rich-text li[data-list="unchecked"]::before {
          content: "\\2610";
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
