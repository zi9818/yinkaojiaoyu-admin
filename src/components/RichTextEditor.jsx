// @ts-ignore;
import React, { useEffect, useMemo, useRef } from 'react';
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
import { normalizeRichTextHtml, sanitizeRichTextHtml } from '@/utils/richText';

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
  children
}) {
  return <button
      type="button"
      title={title}
      onMouseDown={(event) => {
      event.preventDefault();
    }}
      onClick={onClick}
      className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
    >
      {children}
    </button>;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = '请输入活动描述',
  minHeight = 240
}) {
  const editorRef = useRef(null);
  const selectionRef = useRef(null);
  const lastSyncedValueRef = useRef(normalizeRichTextHtml(value));

  const normalizedValue = useMemo(() => normalizeRichTextHtml(value), [value]);

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

  const syncHtml = (nextHtml, syncDom = false) => {
    const sanitized = normalizeRichTextHtml(nextHtml);
    lastSyncedValueRef.current = sanitized;
    if (syncDom && editorRef.current && editorRef.current.innerHTML !== sanitized) {
      editorRef.current.innerHTML = sanitized;
    }
    if (onChange) {
      onChange(sanitized);
    }
  };

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (editor.innerHTML !== normalizedValue) {
      editor.innerHTML = normalizedValue;
    }
    lastSyncedValueRef.current = normalizedValue;
  }, [normalizedValue]);

  useEffect(() => {
    try {
      document.execCommand('styleWithCSS', false, true);
      document.execCommand('defaultParagraphSeparator', false, 'p');
    } catch (error) {
    }
  }, []);

  const runCommand = (command, commandValue = null) => {
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
    syncHtml(editor.innerHTML);
  };

  const handleInsertLink = () => {
    const nextUrl = window.prompt('请输入链接地址', 'https://');
    if (!nextUrl) return;
    const safeUrl = String(nextUrl).trim();
    if (!safeUrl) return;
    runCommand('createLink', safeUrl);
  };

  return <div className="space-y-3">
      <style>{`
        .activity-rich-editor__editable:empty::before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
        <ToolbarButton title="撤销" onClick={() => runCommand('undo')}>
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="重做" onClick={() => runCommand('redo')}>
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="加粗" onClick={() => runCommand('bold')}>
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="斜体" onClick={() => runCommand('italic')}>
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="下划线" onClick={() => runCommand('underline')}>
          <Underline className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="二级标题" onClick={() => runCommand('formatBlock', 'h2')}>
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="三级标题" onClick={() => runCommand('formatBlock', 'h3')}>
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="无序列表" onClick={() => runCommand('insertUnorderedList')}>
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="有序列表" onClick={() => runCommand('insertOrderedList')}>
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="引用" onClick={() => runCommand('formatBlock', 'blockquote')}>
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="插入链接" onClick={handleInsertLink}>
          <Link className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="取消链接" onClick={() => runCommand('unlink')}>
          <Unlink className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="清除格式" onClick={() => runCommand('removeFormat')}>
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
              className="h-6 w-6 rounded-full border border-white shadow ring-1 ring-gray-200"
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
        className="activity-rich-editor__editable min-h-[240px] w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        style={{
        minHeight
      }}
        onInput={() => {
        saveSelection();
        if (!editorRef.current) return;
        syncHtml(editorRef.current.innerHTML);
      }}
        onPaste={() => {
        window.setTimeout(() => {
          if (!editorRef.current) return;
          const sanitized = sanitizeRichTextHtml(editorRef.current.innerHTML);
          editorRef.current.innerHTML = sanitized;
          saveSelection();
          syncHtml(sanitized);
        }, 0);
      }}
        onBlur={() => {
        if (!editorRef.current) return;
        const sanitized = sanitizeRichTextHtml(editorRef.current.innerHTML);
        editorRef.current.innerHTML = sanitized;
        saveSelection();
        syncHtml(sanitized, true);
      }}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
      />

      <div className="text-xs text-gray-500">
        支持标题、加粗、列表、引用、链接和文字颜色。活动列表摘要会根据这里的内容自动生成。
      </div>
    </div>;
}
