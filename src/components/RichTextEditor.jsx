// @ts-ignore;
import React, { useEffect, useMemo, useRef, useState } from 'react';
// @ts-ignore;
import {
  Bold,
  Italic,
  Underline,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link,
  Unlink,
  Eraser,
  Undo2,
  Redo2
} from 'lucide-react';
import { normalizeRichTextHtml, sanitizeRichTextHtml } from './richText';

const COLOR_SWATCHES = [
  '#111827',
  '#dc2626',
  '#ea580c',
  '#16a34a',
  '#2563eb',
  '#7c3aed'
];

function ToolbarButton({
  title,
  onClick,
  children,
  isActive = false,
  disabled = false
}) {
  return <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(event) => {
      event.preventDefault();
    }}
      onClick={onClick}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md border text-gray-700 transition-colors ${
      isActive ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 bg-white hover:bg-gray-50'
    } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      {children}
    </button>;
}

function findClosestTagName(node, root) {
  let current = node && node.nodeType === 1 ? node : node?.parentNode;
  while (current && current !== root) {
    if (current.tagName) {
      return String(current.tagName).toLowerCase();
    }
    current = current.parentNode;
  }
  return '';
}

function findClosestLink(node, root) {
  let current = node && node.nodeType === 1 ? node : node?.parentNode;
  while (current && current !== root) {
    if (String(current.tagName || '').toLowerCase() === 'a') {
      return current;
    }
    current = current.parentNode;
  }
  return null;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = '请输入活动描述',
  minHeight = 240
}) {
  const editorRef = useRef(null);
  const selectionRef = useRef(null);
  const lastValueRef = useRef('');
  const [toolbarState, setToolbarState] = useState({
    bold: false,
    italic: false,
    underline: false,
    bulletList: false,
    orderedList: false,
    heading2: false,
    heading3: false,
    blockquote: false,
    link: false
  });
  const [isEmpty, setIsEmpty] = useState(!normalizeRichTextHtml(value));

  // 编辑态尽量保留浏览器当前生成的 HTML，避免每次输入都被强行规范化后打断光标。
  const editorValue = useMemo(() => sanitizeRichTextHtml(value), [value]);

  const setEmptyStateFromHtml = (html) => {
    setIsEmpty(!normalizeRichTextHtml(html));
  };

  const saveSelection = () => {
    if (typeof window === 'undefined') return;
    const editor = editorRef.current;
    const selection = window.getSelection ? window.getSelection() : null;
    if (!editor || !selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return;
    selectionRef.current = range.cloneRange();
  };

  const restoreSelection = () => {
    if (typeof window === 'undefined') return;
    const selection = window.getSelection ? window.getSelection() : null;
    if (!selection || !selectionRef.current) return;
    selection.removeAllRanges();
    selection.addRange(selectionRef.current);
  };

  const updateToolbarState = () => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const editor = editorRef.current;
    const selection = window.getSelection ? window.getSelection() : null;
    const anchorNode = selection?.anchorNode || null;
    const anchorInsideEditor = !!(editor && anchorNode && editor.contains(anchorNode));

    const queryState = (command) => {
      if (!anchorInsideEditor) return false;
      try {
        return !!document.queryCommandState(command);
      } catch (error) {
        return false;
      }
    };

    const blockTagName = anchorInsideEditor ? findClosestTagName(anchorNode, editor) : '';
    setToolbarState({
      bold: queryState('bold'),
      italic: queryState('italic'),
      underline: queryState('underline'),
      bulletList: queryState('insertUnorderedList'),
      orderedList: queryState('insertOrderedList'),
      heading2: blockTagName === 'h2',
      heading3: blockTagName === 'h3',
      blockquote: blockTagName === 'blockquote',
      link: !!(anchorInsideEditor && findClosestLink(anchorNode, editor))
    });
  };

  const emitHtmlChange = (nextHtml) => {
    const html = String(nextHtml || '');
    lastValueRef.current = html;
    setEmptyStateFromHtml(html);
    onChange?.(html);
  };

  const syncEditorHtml = (nextHtml) => {
    const editor = editorRef.current;
    if (!editor) return;
    if (editor.innerHTML !== nextHtml) {
      editor.innerHTML = nextHtml;
    }
    emitHtmlChange(nextHtml);
  };

  const normalizeEditorContent = (mode = 'normalize') => {
    const editor = editorRef.current;
    if (!editor) return;
    const rawHtml = editor.innerHTML;
    const nextHtml = mode === 'sanitize'
      ? sanitizeRichTextHtml(rawHtml)
      : normalizeRichTextHtml(rawHtml);
    syncEditorHtml(nextHtml);
    updateToolbarState();
  };

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (lastValueRef.current === editorValue && editor.innerHTML === editorValue) return;

    // 仅在外部值真实变化时回填，避免用户输入过程中被 React 状态打断。
    if (editor.innerHTML !== editorValue) {
      editor.innerHTML = editorValue;
    }
    lastValueRef.current = editorValue;
    setEmptyStateFromHtml(editorValue);
    updateToolbarState();
  }, [editorValue]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    try {
      document.execCommand('styleWithCSS', false, true);
      document.execCommand('defaultParagraphSeparator', false, 'p');
    } catch (error) {
      // 低码容器内部分浏览器实现会忽略该能力，这里静默即可。
    }
  }, []);

  const runCommand = (command, commandValue = null) => {
    if (typeof document === 'undefined') return;
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    restoreSelection();
    try {
      document.execCommand('styleWithCSS', false, true);
      document.execCommand(command, false, commandValue);
    } catch (error) {
      return;
    }
    saveSelection();
    emitHtmlChange(editor.innerHTML);
    updateToolbarState();
  };

  const toggleBlock = (tagName) => {
    if (typeof document === 'undefined') return;
    const editor = editorRef.current;
    if (!editor) return;
    const selection = typeof window !== 'undefined' && window.getSelection ? window.getSelection() : null;
    const currentTag = selection?.anchorNode ? findClosestTagName(selection.anchorNode, editor) : '';
    const nextValue = currentTag === tagName ? 'p' : tagName;
    runCommand('formatBlock', nextValue);
  };

  const handleInsertLink = () => {
    const editor = editorRef.current;
    if (!editor || typeof window === 'undefined') return;
    const selection = window.getSelection ? window.getSelection() : null;
    const currentLink = selection?.anchorNode ? findClosestLink(selection.anchorNode, editor) : null;
    const currentHref = String(currentLink?.getAttribute('href') || 'https://').trim() || 'https://';
    const nextUrl = window.prompt('请输入链接地址', currentHref);
    if (nextUrl === null) return;

    const safeUrl = String(nextUrl).trim();
    if (!safeUrl) {
      runCommand('unlink');
      return;
    }
    runCommand('createLink', safeUrl);
  };

  const clearFormatting = () => {
    runCommand('removeFormat');
    runCommand('unlink');
  };

  const handleEnter = (event) => {
    if (typeof document === 'undefined') return;
    const editor = editorRef.current;
    const selection = typeof window !== 'undefined' && window.getSelection ? window.getSelection() : null;
    const currentTag = editor && selection?.anchorNode ? findClosestTagName(selection.anchorNode, editor) : '';

    // 列表项内保留浏览器默认回车行为，避免回车后丢失 li 结构。
    if (currentTag === 'li') {
      return;
    }

    event.preventDefault();
    if (event.shiftKey) {
      runCommand('insertLineBreak');
      return;
    }
    runCommand('insertParagraph');
  };

  return <div className="space-y-3">
      <style>{`
        .activity-rich-editor__editable {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid #d1d5db;
          background: #ffffff;
          padding: 0.75rem 1rem;
          color: #111827;
          font-size: 0.875rem;
          line-height: 1.8;
          outline: none;
          white-space: normal;
          word-break: break-word;
        }

        .activity-rich-editor__editable:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.18);
        }

        .activity-rich-editor__editable p,
        .activity-rich-editor__editable div {
          margin: 0 0 12px;
        }

        .activity-rich-editor__editable h1 {
          margin: 0 0 14px;
          font-size: 24px;
          font-weight: 700;
          line-height: 1.4;
        }

        .activity-rich-editor__editable h2 {
          margin: 0 0 14px;
          font-size: 20px;
          font-weight: 700;
          line-height: 1.5;
        }

        .activity-rich-editor__editable h3 {
          margin: 0 0 12px;
          font-size: 18px;
          font-weight: 600;
          line-height: 1.5;
        }

        .activity-rich-editor__editable ul,
        .activity-rich-editor__editable ol {
          margin: 0 0 12px;
          padding-left: 20px;
        }

        .activity-rich-editor__editable li {
          margin-bottom: 8px;
        }

        .activity-rich-editor__editable blockquote {
          margin: 0 0 12px;
          border-left: 4px solid #d1d5db;
          background: #f9fafb;
          padding: 8px 12px;
          color: #4b5563;
        }

        .activity-rich-editor__editable a {
          color: #2563eb;
          text-decoration: underline;
        }

        .activity-rich-editor__editable.is-empty::before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          position: absolute;
          left: 1rem;
          top: 0.75rem;
        }
      `}</style>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
        <ToolbarButton
          title="撤销"
          onClick={() => runCommand('undo')}
        >
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="重做"
          onClick={() => runCommand('redo')}
        >
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="加粗"
          isActive={toolbarState.bold}
          onClick={() => runCommand('bold')}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="斜体"
          isActive={toolbarState.italic}
          onClick={() => runCommand('italic')}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="下划线"
          isActive={toolbarState.underline}
          onClick={() => runCommand('underline')}
        >
          <Underline className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="二级标题"
          isActive={toolbarState.heading2}
          onClick={() => toggleBlock('h2')}
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="三级标题"
          isActive={toolbarState.heading3}
          onClick={() => toggleBlock('h3')}
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="无序列表"
          isActive={toolbarState.bulletList}
          onClick={() => runCommand('insertUnorderedList')}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="有序列表"
          isActive={toolbarState.orderedList}
          onClick={() => runCommand('insertOrderedList')}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="引用"
          isActive={toolbarState.blockquote}
          onClick={() => toggleBlock('blockquote')}
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="插入链接"
          isActive={toolbarState.link}
          onClick={handleInsertLink}
        >
          <Link className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="取消链接"
          isActive={false}
          disabled={!toolbarState.link}
          onClick={() => runCommand('unlink')}
        >
          <Unlink className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="清除格式"
          isActive={false}
          onClick={clearFormatting}
        >
          <Eraser className="h-4 w-4" />
        </ToolbarButton>

        <div className="ml-2 flex items-center gap-2">
          {COLOR_SWATCHES.map((color) => <button
              key={color}
              type="button"
              title={`文字颜色 ${color}`}
              onMouseDown={(event) => {
              event.preventDefault();
            }}
              onClick={() => runCommand('foreColor', color)}
              className="h-6 w-6 rounded-full border border-white shadow ring-1 ring-gray-200 transition-opacity"
              style={{
              backgroundColor: color
            }}
            />)}
        </div>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        className={`activity-rich-editor__editable relative ${isEmpty ? 'is-empty' : ''}`}
        style={{
        minHeight
      }}
        onFocus={updateToolbarState}
        onInput={() => {
        saveSelection();
        if (!editorRef.current) return;
        emitHtmlChange(editorRef.current.innerHTML);
        updateToolbarState();
      }}
        onPaste={() => {
        window.setTimeout(() => {
          normalizeEditorContent('sanitize');
          saveSelection();
        }, 0);
      }}
        onBlur={() => {
        saveSelection();
        normalizeEditorContent('normalize');
      }}
        onKeyDown={(event) => {
        if (event.key === 'Enter') {
          handleEnter(event);
          return;
        }
      }}
        onKeyUp={() => {
        saveSelection();
        updateToolbarState();
      }}
        onMouseUp={() => {
        saveSelection();
        updateToolbarState();
      }}
      />

      <div className="text-xs text-gray-500">
        支持标题、加粗、列表、引用、链接和文字颜色。回车会保留段落结构，活动列表摘要会根据这里的内容自动生成。
      </div>
    </div>;
}
