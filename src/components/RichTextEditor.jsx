// @ts-ignore;
import React, { useEffect, useMemo, useRef, useState } from 'react';
// @ts-ignore;
import {
  Undo2,
  Redo2,
  LoaderCircle,
  AlertCircle
} from 'lucide-react';
import {
  extractCloudRichTextImageIds,
  normalizeRichTextHtml,
  replaceRichTextImageUrls
} from './richText';

const QUILL_CDN_SOURCES = [
  {
    name: 'jsDelivr',
    scriptUrl: 'https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.js',
    styleUrl: 'https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css'
  },
  {
    name: 'JSDMirror',
    scriptUrl: 'https://cdn.jsdmirror.com/npm/quill@2.0.3/dist/quill.js',
    styleUrl: 'https://cdn.jsdmirror.com/npm/quill@2.0.3/dist/quill.snow.css'
  }
];
const QUILL_ASSET_TIMEOUT = 10000;

// 颜色面板只扩展 Quill 原生 ql-color 下拉的色值，不额外接管编辑器格式逻辑。
const COLOR_SWATCHES = [
  '#111827',
  '#1f2937',
  '#374151',
  '#6b7280',
  '#9ca3af',
  '#dc2626',
  '#ef4444',
  '#f97316',
  '#ea580c',
  '#f59e0b',
  '#eab308',
  '#65a30d',
  '#16a34a',
  '#10b981',
  '#14b8a6',
  '#06b6d4',
  '#2563eb',
  '#3b82f6',
  '#6366f1',
  '#7c3aed',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899'
];

let quillAssetsPromise = null;
let quillAssetSourceName = '';

function waitForAssetLoad(element, assetType, url) {
  const currentState = element?.dataset?.loadState;
  if (currentState === 'loaded') {
    return Promise.resolve();
  }
  if (currentState === 'failed') {
    return Promise.reject(new Error(`加载 Quill ${assetType}失败：${url}`));
  }

  return new Promise((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      if (typeof window !== 'undefined') {
        window.clearTimeout(timer);
      }
      element.removeEventListener('load', handleLoad);
      element.removeEventListener('error', handleError);
    };

    const finish = (isSuccess, message) => {
      if (settled) return;
      settled = true;
      element.dataset.loadState = isSuccess ? 'loaded' : 'failed';
      cleanup();
      if (isSuccess) {
        resolve();
        return;
      }
      reject(new Error(message));
    };

    const handleLoad = () => finish(true);
    const handleError = () => finish(false, `加载 Quill ${assetType}失败：${url}`);
    const timer = typeof window !== 'undefined'
      ? window.setTimeout(() => finish(false, `加载 Quill ${assetType}超时：${url}`), QUILL_ASSET_TIMEOUT)
      : null;

    element.addEventListener('load', handleLoad);
    element.addEventListener('error', handleError);
  });
}

function ensureStyleSheet(url) {
  if (typeof document === 'undefined') {
    return Promise.reject(new Error('当前环境不支持动态加载 Quill 样式'));
  }

  const existed = document.querySelector(`link[data-activity-richtext-style="${url}"]`);
  if (existed) {
    if (existed.dataset.loadState === 'failed') {
      existed.remove();
    } else {
      return waitForAssetLoad(existed, '样式', url);
    }
  }

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  link.setAttribute('data-activity-richtext-style', url);
  link.dataset.loadState = 'loading';
  const loadPromise = waitForAssetLoad(link, '样式', url);
  document.head.appendChild(link);
  return loadPromise;
}

function ensureScript(url) {
  if (typeof document === 'undefined') {
    return Promise.reject(new Error('当前环境不支持动态加载 Quill 脚本'));
  }

  const win = window;
  if (win.Quill) {
    return Promise.resolve(win.Quill);
  }

  return new Promise((resolve, reject) => {
    const existed = document.querySelector(`script[data-activity-richtext-script="${url}"]`);
    if (existed) {
      if (existed.dataset.loadState === 'failed') {
        existed.remove();
      } else {
        waitForAssetLoad(existed, '脚本', url)
          .then(() => {
            if (win.Quill) {
              resolve(win.Quill);
              return;
            }
            reject(new Error('Quill 脚本已加载，但窗口对象上没有 Quill'));
          })
          .catch(reject);
        return;
      }
    }

    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.setAttribute('data-activity-richtext-script', url);
    script.dataset.loadState = 'loading';
    const loadPromise = waitForAssetLoad(script, '脚本', url);
    document.body.appendChild(script);
    loadPromise
      .then(() => {
        if (win.Quill) {
          resolve(win.Quill);
          return;
        }
        reject(new Error('Quill 脚本已加载，但窗口对象上没有 Quill'));
      })
      .catch(reject);
  });
}

function ensureQuillAssets() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('当前环境不支持加载 Quill 编辑器'));
  }

  if (window.Quill) {
    return Promise.resolve({
      Quill: window.Quill,
      sourceName: quillAssetSourceName || '当前页面缓存'
    });
  }

  if (!quillAssetsPromise) {
    quillAssetsPromise = Promise.resolve()
      .then(async () => {
        const loadErrors = [];

        // 这里按“主源 -> 国内镜像”顺序加载，避免 CloudBase 页面偶发访问海外 CDN 失败时直接不可用。
        for (const source of QUILL_CDN_SOURCES) {
          try {
            await ensureStyleSheet(source.styleUrl);
            const Quill = await ensureScript(source.scriptUrl);
            quillAssetSourceName = source.name;
            return {
              Quill,
              sourceName: source.name
            };
          } catch (error) {
            loadErrors.push(`${source.name}: ${error?.message || '未知错误'}`);
          }
        }

        throw new Error(`Quill 资源加载失败，已依次尝试 ${QUILL_CDN_SOURCES.map((item) => item.name).join(' -> ')}。${loadErrors.join('；')}`);
      })
      .catch((error) => {
        quillAssetsPromise = null;
        quillAssetSourceName = '';
        throw error;
      });
  }

  return quillAssetsPromise;
}

function buildUploadCloudPath(file) {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).slice(2, 8);
  const extension = String(file?.name || '').split('.').pop() || 'png';
  return `richtext/${timestamp}_${randomStr}.${extension}`;
}

function createTempUrlMap(fileList) {
  const urlMap = {};
  (Array.isArray(fileList) ? fileList : []).forEach((item) => {
    const fileID = String(item?.fileID || '').trim();
    const tempFileURL = String(item?.tempFileURL || '').trim();
    if (!fileID || !tempFileURL) return;
    urlMap[fileID] = tempFileURL;
  });
  return urlMap;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = '请输入活动描述',
  minHeight = 240
}) {
  const editorHostRef = useRef(null);
  const toolbarRef = useRef(null);
  const quillRef = useRef(null);
  const fileInputRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const isSyncingRef = useRef(false);
  const reverseImageMapRef = useRef({});
  const textChangeHandlerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isEmpty, setIsEmpty] = useState(!normalizeRichTextHtml(value));
  const editorValue = useMemo(() => normalizeRichTextHtml(value), [value]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const setEmptyStateFromHtml = (html) => {
    setIsEmpty(!normalizeRichTextHtml(html));
  };

  const registerImageTempUrls = (urlMap) => {
    const nextMap = {
      ...reverseImageMapRef.current
    };

    Object.entries(urlMap || {}).forEach(([fileID, tempUrl]) => {
      if (!fileID || !tempUrl) return;
      nextMap[String(tempUrl)] = String(fileID);
    });

    reverseImageMapRef.current = nextMap;
  };

  const restoreCloudImageFileIds = (html) => {
    let nextHtml = String(html || '');
    const entries = Object.entries(reverseImageMapRef.current || {}).sort((left, right) => right[0].length - left[0].length);
    entries.forEach(([tempUrl, fileID]) => {
      if (!tempUrl || !fileID) return;
      nextHtml = nextHtml.split(tempUrl).join(fileID);
    });
    return nextHtml;
  };

  const getCloudInstance = async () => {
    const tcb = await window.$w?.cloud?.getCloudInstance();
    if (!tcb) {
      throw new Error('无法获取云开发实例');
    }
    return tcb;
  };

  const resolveCloudImageUrlMap = async (fileIDs) => {
    const safeFileIDs = Array.from(new Set((Array.isArray(fileIDs) ? fileIDs : []).map((item) => String(item || '').trim()).filter(Boolean)));
    if (safeFileIDs.length === 0) return {};

    const tcb = await getCloudInstance();
    const result = await tcb.getTempFileURL({
      fileList: safeFileIDs
    });
    const urlMap = createTempUrlMap(result?.fileList || []);
    registerImageTempUrls(urlMap);
    return urlMap;
  };

  const resolveEditorDisplayHtml = async (rawHtml) => {
    const normalizedHtml = normalizeRichTextHtml(rawHtml);
    if (!normalizedHtml) return '';

    const cloudImageIds = extractCloudRichTextImageIds(normalizedHtml);
    if (cloudImageIds.length === 0) {
      return normalizedHtml;
    }

    try {
      const urlMap = await resolveCloudImageUrlMap(cloudImageIds);
      if (Object.keys(urlMap).length === 0) {
        return normalizedHtml;
      }
      return replaceRichTextImageUrls(normalizedHtml, urlMap);
    } catch (error) {
      console.error('解析编辑态富文本图片临时链接失败:', error);
      return normalizedHtml;
    }
  };

  const exportSemanticHtml = (editorInstance) => {
    const quill = editorInstance || quillRef.current;
    if (!quill) return '';

    const rawHtml = typeof quill.getSemanticHTML === 'function'
      ? quill.getSemanticHTML()
      : quill.root?.innerHTML || '';

    return normalizeRichTextHtml(restoreCloudImageFileIds(rawHtml));
  };

  const applyEditorHtml = async (rawHtml, options = {}) => {
    const quill = quillRef.current;
    if (!quill) return;

    const displayHtml = await resolveEditorDisplayHtml(rawHtml);
    isSyncingRef.current = true;
    quill.setText('');
    if (displayHtml) {
      quill.clipboard.dangerouslyPasteHTML(displayHtml);
    }
    if (options.clearHistory) {
      quill.history.clear();
    }
    isSyncingRef.current = false;

    const normalizedHtml = exportSemanticHtml(quill);
    setEmptyStateFromHtml(normalizedHtml);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setErrorMessage('');

      try {
        const { Quill } = await ensureQuillAssets();
        if (cancelled || quillRef.current || !editorHostRef.current || !toolbarRef.current) return;

        const quill = new Quill(editorHostRef.current, {
          theme: 'snow',
          placeholder,
          modules: {
            toolbar: {
              container: toolbarRef.current,
              handlers: {
                undo() {
                  this.quill.history.undo();
                },
                redo() {
                  this.quill.history.redo();
                },
                image() {
                  fileInputRef.current?.click();
                }
              }
            },
            history: {
              delay: 300,
              maxStack: 100,
              userOnly: true
            }
          }
        });

        quillRef.current = quill;
        textChangeHandlerRef.current = () => {
          if (isSyncingRef.current) return;
          const nextHtml = exportSemanticHtml(quill);
          setEmptyStateFromHtml(nextHtml);
          onChangeRef.current?.(nextHtml);
        };
        quill.on('text-change', textChangeHandlerRef.current);

        await applyEditorHtml(editorValue, {
          clearHistory: true
        });
        if (cancelled) return;

        setIsReady(true);
      } catch (error) {
        if (cancelled) return;
        console.error('初始化 Quill 编辑器失败:', error);
        setErrorMessage(error?.message || 'Quill 编辑器初始化失败，请检查 CDN 访问是否正常');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (quillRef.current && textChangeHandlerRef.current) {
        quillRef.current.off('text-change', textChangeHandlerRef.current);
      }
      quillRef.current = null;
      textChangeHandlerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isReady) {
      setEmptyStateFromHtml(editorValue);
      return undefined;
    }

    let cancelled = false;

    (async () => {
      const quill = quillRef.current;
      if (!quill) return;

      const currentHtml = exportSemanticHtml(quill);
      if (currentHtml === editorValue) {
        setEmptyStateFromHtml(editorValue);
        return;
      }

      await applyEditorHtml(editorValue, {
        clearHistory: true
      });
      if (!cancelled) {
        setEmptyStateFromHtml(editorValue);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [editorValue, isReady]);

  const handleRichTextImageSelect = async (event) => {
    const file = Array.from(event.target.files || [])[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      window.alert('请选择图片文件');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      window.alert('富文本图片大小不能超过 5MB');
      event.target.value = '';
      return;
    }

    setUploading(true);
    try {
      const tcb = await getCloudInstance();
      const uploadResult = await tcb.uploadFile({
        cloudPath: buildUploadCloudPath(file),
        filePath: file
      });

      const fileID = String(uploadResult?.fileID || '').trim();
      if (!fileID) {
        throw new Error('富文本图片上传成功，但未返回 fileID');
      }

      const urlMap = await resolveCloudImageUrlMap([fileID]);
      const previewUrl = urlMap[fileID];
      if (!previewUrl) {
        throw new Error('富文本图片上传成功，但未获取到预览地址');
      }

      const quill = quillRef.current;
      if (!quill) return;

      const range = quill.getSelection(true);
      const insertIndex = range ? range.index : quill.getLength();
      quill.insertEmbed(insertIndex, 'image', previewUrl, 'user');
      quill.setSelection(insertIndex + 1, 0, 'silent');

      const nextHtml = exportSemanticHtml(quill);
      setEmptyStateFromHtml(nextHtml);
      onChangeRef.current?.(nextHtml);
    } catch (error) {
      console.error('上传富文本图片失败:', error);
      window.alert(`上传富文本图片失败：${error?.message || '请稍后重试'}`);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  return <div className="space-y-3">
      <style>{`
        .activity-quill-toolbar.ql-toolbar.ql-snow {
          border: 1px solid #d1d5db;
          border-radius: 0.5rem 0.5rem 0 0;
          background: #f9fafb;
          padding: 0.5rem;
        }

        .activity-quill-toolbar.ql-toolbar .ql-formats {
          margin-right: 10px;
        }

        .activity-quill-toolbar.ql-toolbar button,
        .activity-quill-toolbar.ql-toolbar .ql-picker {
          height: 2.25rem;
        }

        .activity-quill-toolbar.ql-toolbar button {
          width: 2.25rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.375rem;
        }

        .activity-quill-toolbar.ql-toolbar button:hover {
          background: #eff6ff;
        }

        .activity-quill-toolbar .activity-quill-toolbar__heading {
          width: auto !important;
          min-width: 2.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }

        .activity-quill-toolbar .ql-picker.ql-color {
          width: 2.75rem;
        }

        .activity-quill-toolbar .ql-picker.ql-color .ql-picker-options {
          width: 224px;
        }

        .activity-quill-toolbar .ql-picker.ql-color .ql-picker-label,
        .activity-quill-toolbar .ql-picker.ql-color .ql-picker-item {
          padding: 2px;
        }

        .activity-quill-editor.ql-container.ql-snow {
          border: 1px solid #d1d5db;
          border-top: none;
          border-radius: 0 0 0.5rem 0.5rem;
          background: #ffffff;
        }

        .activity-quill-editor .ql-editor {
          min-height: ${Math.max(minHeight, 240)}px;
          padding: 0.75rem 1rem;
          color: #111827;
          font-size: 0.875rem;
          line-height: 1.8;
          word-break: break-word;
        }

        .activity-quill-editor .ql-editor.ql-blank::before {
          left: 1rem;
          right: 1rem;
          color: #9ca3af;
          font-style: normal;
        }

        .activity-quill-editor .ql-editor:focus {
          outline: none;
        }

        .activity-quill-editor.ql-container.ql-snow:focus-within {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.18);
        }

        .activity-quill-editor .ql-editor h1 {
          margin: 0 0 14px;
          font-size: 24px;
          font-weight: 700;
          line-height: 1.4;
        }

        .activity-quill-editor .ql-editor h2 {
          margin: 0 0 14px;
          font-size: 20px;
          font-weight: 700;
          line-height: 1.5;
        }

        .activity-quill-editor .ql-editor h3 {
          margin: 0 0 12px;
          font-size: 18px;
          font-weight: 600;
          line-height: 1.5;
        }

        .activity-quill-editor .ql-editor p {
          margin: 0 0 12px;
        }

        .activity-quill-editor .ql-editor em,
        .activity-quill-editor .ql-editor i {
          font-style: italic;
        }

        .activity-quill-editor .ql-editor ul,
        .activity-quill-editor .ql-editor ol {
          margin: 0 0 12px;
          padding-left: 20px;
        }

        .activity-quill-editor .ql-editor ul {
          list-style: disc;
        }

        .activity-quill-editor .ql-editor ol {
          list-style: decimal;
        }

        .activity-quill-editor .ql-editor li {
          margin-bottom: 8px;
        }

        .activity-quill-editor .ql-editor blockquote {
          margin: 0 0 12px;
          border-left: 4px solid #d1d5db;
          background: #f9fafb;
          padding: 8px 12px;
          color: #4b5563;
        }

        .activity-quill-editor .ql-editor a {
          color: #2563eb;
          text-decoration: underline;
        }

        .activity-quill-editor .ql-editor img {
          display: block;
          max-width: 100%;
          height: auto;
          margin: 12px 0;
          border-radius: 12px;
        }
      `}</style>

      {loading ? <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          <span>正在加载 Quill 富文本编辑器...</span>
        </div> : null}

      {errorMessage ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="h-4 w-4" />
            <span>Quill 富文本编辑器初始化失败</span>
          </div>
          <div className="mt-2 text-xs leading-6 text-red-600">
            {errorMessage}。当前组件会自动按 <code>jsDelivr</code> -&gt; <code>JSDMirror</code> 顺序重试，请确认 CloudBase 页面至少可以访问其中一个 CDN。
          </div>
        </div> : null}

      <div ref={toolbarRef} className="activity-quill-toolbar">
        <span className="ql-formats">
          <button type="button" className="ql-undo" title="撤销">
            <Undo2 className="h-4 w-4" />
          </button>
          <button type="button" className="ql-redo" title="重做">
            <Redo2 className="h-4 w-4" />
          </button>
        </span>

        <span className="ql-formats">
          <button type="button" className="ql-bold" title="加粗" />
          <button type="button" className="ql-italic" title="斜体" />
          <button type="button" className="ql-underline" title="下划线" />
        </span>

        <span className="ql-formats">
          <button type="button" className="ql-header activity-quill-toolbar__heading" value="2" title="二级标题" />
          <button type="button" className="ql-header activity-quill-toolbar__heading" value="3" title="三级标题" />
        </span>

        <span className="ql-formats">
          <button type="button" className="ql-list" value="bullet" title="无序列表" />
          <button type="button" className="ql-list" value="ordered" title="有序列表" />
          <button type="button" className="ql-blockquote" title="引用" />
        </span>

        <span className="ql-formats">
          <button type="button" className="ql-link" title="插入链接" />
          <button type="button" className="ql-image" title={uploading ? '图片上传中...' : '上传图片'} />
          <button type="button" className="ql-clean" title="清除格式" />
        </span>

        <span className="ql-formats">
          <select className="ql-color" defaultValue="" title="文字颜色">
            <option value="" />
            {COLOR_SWATCHES.map((color) => <option key={color} value={color} />)}
          </select>
          <select className="ql-align" defaultValue="" title="段落对齐">
            <option value="" />
            <option value="center" />
            <option value="right" />
            <option value="justify" />
          </select>
        </span>
      </div>

      <div ref={editorHostRef} className={`activity-quill-editor ${isEmpty ? 'is-empty' : ''}`} />

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleRichTextImageSelect}
      />
    </div>;
}
