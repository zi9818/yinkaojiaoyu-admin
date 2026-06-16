// @ts-ignore;
import React, { useEffect, useMemo } from 'react';
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
// @ts-ignore;
import { EditorContent, useEditor } from '@tiptap/react';
// @ts-ignore;
import StarterKit from '@tiptap/starter-kit';
// @ts-ignore;
import { TextStyle } from '@tiptap/extension-text-style';
// @ts-ignore;
import Color from '@tiptap/extension-color';
// @ts-ignore;
import Placeholder from '@tiptap/extension-placeholder';
import { normalizeRichTextHtml } from './richText';

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

export function RichTextEditor({
  value,
  onChange,
  placeholder = '请输入活动描述',
  minHeight = 240
}) {
  // 统一先走项目已有的富文本清洗逻辑，避免旧数据和新编辑器的 HTML 结构不一致。
  const normalizedValue = useMemo(() => normalizeRichTextHtml(value), [value]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
    StarterKit.configure({
      heading: {
        levels: [2, 3]
      },
      link: {
        autolink: true,
        linkOnPaste: true,
        openOnClick: false,
        defaultProtocol: 'https'
      }
    }),
    TextStyle,
    Color,
    Placeholder.configure({
      placeholder
    })],
    content: normalizedValue,
    editorProps: {
      attributes: {
        class: 'activity-rich-editor__editable',
        style: `min-height: ${minHeight}px;`
      }
    },
    onUpdate: ({
      editor: currentEditor
    }) => {
      // Tiptap 负责编辑体验，真正落库前仍统一收敛为项目可控的 HTML 结构。
      const normalizedHtml = normalizeRichTextHtml(currentEditor.getHTML());
      onChange?.(normalizedHtml);
    },
    onBlur: ({
      editor: currentEditor
    }) => {
      const rawHtml = currentEditor.getHTML();
      const normalizedHtml = normalizeRichTextHtml(rawHtml);

      // 失焦时将内容归一化回编辑器，确保再次打开时结构和保存结果一致。
      if (normalizedHtml !== rawHtml) {
        currentEditor.commands.setContent(normalizedHtml || '', false);
      }

      onChange?.(normalizedHtml);
    }
  });

  useEffect(() => {
    if (!editor) return;
    const currentNormalizedHtml = normalizeRichTextHtml(editor.getHTML());
    if (currentNormalizedHtml === normalizedValue) return;

    // 仅在外部值真正变化时回填内容，避免每次输入都重置光标。
    editor.commands.setContent(normalizedValue || '', false);
  }, [editor, normalizedValue]);

  const runCommand = (callback) => {
    if (!editor) return;
    callback(editor);
  };

  const handleInsertLink = () => {
    if (!editor) return;
    const currentHref = editor.getAttributes('link')?.href || 'https://';
    const nextUrl = window.prompt('请输入链接地址', currentHref);
    if (nextUrl === null) return;

    const safeUrl = String(nextUrl).trim();
    if (!safeUrl) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({
      href: safeUrl
    }).run();
  };

  const clearFormatting = () => {
    if (!editor) return;
    editor.chain().focus().unsetAllMarks().clearNodes().run();
  };

  const isEditorReady = !!editor;

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

        .activity-rich-editor__editable p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
      `}</style>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
        <ToolbarButton
          title="撤销"
          disabled={!editor?.can().chain().focus().undo().run()}
          onClick={() => runCommand((currentEditor) => currentEditor.chain().focus().undo().run())}
        >
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="重做"
          disabled={!editor?.can().chain().focus().redo().run()}
          onClick={() => runCommand((currentEditor) => currentEditor.chain().focus().redo().run())}
        >
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="加粗"
          isActive={editor?.isActive('bold')}
          disabled={!isEditorReady}
          onClick={() => runCommand((currentEditor) => currentEditor.chain().focus().toggleBold().run())}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="斜体"
          isActive={editor?.isActive('italic')}
          disabled={!isEditorReady}
          onClick={() => runCommand((currentEditor) => currentEditor.chain().focus().toggleItalic().run())}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="下划线"
          isActive={editor?.isActive('underline')}
          disabled={!isEditorReady}
          onClick={() => runCommand((currentEditor) => currentEditor.chain().focus().toggleUnderline().run())}
        >
          <Underline className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="二级标题"
          isActive={editor?.isActive('heading', {
          level: 2
        })}
          disabled={!isEditorReady}
          onClick={() => runCommand((currentEditor) => currentEditor.chain().focus().toggleHeading({
          level: 2
        }).run())}
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="三级标题"
          isActive={editor?.isActive('heading', {
          level: 3
        })}
          disabled={!isEditorReady}
          onClick={() => runCommand((currentEditor) => currentEditor.chain().focus().toggleHeading({
          level: 3
        }).run())}
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="无序列表"
          isActive={editor?.isActive('bulletList')}
          disabled={!isEditorReady}
          onClick={() => runCommand((currentEditor) => currentEditor.chain().focus().toggleBulletList().run())}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="有序列表"
          isActive={editor?.isActive('orderedList')}
          disabled={!isEditorReady}
          onClick={() => runCommand((currentEditor) => currentEditor.chain().focus().toggleOrderedList().run())}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="引用"
          isActive={editor?.isActive('blockquote')}
          disabled={!isEditorReady}
          onClick={() => runCommand((currentEditor) => currentEditor.chain().focus().toggleBlockquote().run())}
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="插入链接"
          isActive={editor?.isActive('link')}
          disabled={!isEditorReady}
          onClick={handleInsertLink}
        >
          <Link className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="取消链接"
          isActive={false}
          disabled={!editor?.isActive('link')}
          onClick={() => runCommand((currentEditor) => currentEditor.chain().focus().extendMarkRange('link').unsetLink().run())}
        >
          <Unlink className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="清除格式"
          isActive={false}
          disabled={!isEditorReady}
          onClick={clearFormatting}
        >
          <Eraser className="h-4 w-4" />
        </ToolbarButton>

        <div className="ml-2 flex items-center gap-2">
          {COLOR_SWATCHES.map((color) => <button
              key={color}
              type="button"
              title={`文字颜色 ${color}`}
              disabled={!isEditorReady}
              onMouseDown={(event) => {
              event.preventDefault();
            }}
              onClick={() => runCommand((currentEditor) => currentEditor.chain().focus().setColor(color).run())}
              className={`h-6 w-6 rounded-full border border-white shadow ring-1 transition-opacity ${
              isEditorReady ? 'opacity-100' : 'cursor-not-allowed opacity-50'
            } ${editor?.isActive('textStyle', {
              color
            }) ? 'ring-2 ring-blue-500 ring-offset-2' : 'ring-gray-200'}`}
              style={{
              backgroundColor: color
            }}
            />)}
        </div>
      </div>

      <EditorContent editor={editor} />

      <div className="text-xs text-gray-500">
        支持标题、加粗、列表、引用、链接和文字颜色。活动列表摘要会根据这里的内容自动生成。
      </div>
    </div>;
}
