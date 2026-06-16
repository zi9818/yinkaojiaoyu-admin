import { getRichTextDisplayHtml, normalizeRichTextHtml } from './richText';

// 旧的 CloudBase 官方富文本桥接逻辑已不再作为主方案使用，保留仅为兼容历史代码和验收脚本。
export const ACTIVITY_DESC_EDITOR_COMPONENT_ID = 'activityDescRichEditor';
export const ACTIVITY_DESC_PREVIEW_COMPONENT_ID = 'activityDescRichPreview';

function getCloudBaseComponent($w, componentId) {
  if (!$w || !componentId) return null;
  return $w[componentId] || null;
}

function setCloudBaseComponentValue(component, value) {
  if (!component) return false;

  const nextValue = typeof value === 'string' ? value : '';

  // CloudBase 官方组件文档优先推荐使用 Method API，例如 $w.id.setValue(...) / clearValue()。
  if (!nextValue && typeof component.clearValue === 'function') {
    component.clearValue();
    return true;
  }

  if (typeof component.setValue === 'function') {
    component.setValue(nextValue);
    return true;
  }

  // 某些展示类组件文档只公开 value 属性，这里保留属性写入作为兼容兜底。
  component.value = nextValue;
  return true;
}

export function getCloudBaseRichTextEditorState($w) {
  const component = getCloudBaseComponent($w, ACTIVITY_DESC_EDITOR_COMPONENT_ID);
  const hasStringValue = typeof component?.value === 'string';
  return {
    component,
    mounted: !!component,
    hasStringValue,
    value: hasStringValue ? component.value : ''
  };
}

export function isCloudBaseRichTextEditorReady($w) {
  const editorState = getCloudBaseRichTextEditorState($w);
  return !!editorState.component && editorState.hasStringValue;
}

export function readCloudBaseRichTextValue($w) {
  const editorState = getCloudBaseRichTextEditorState($w);
  return editorState.value;
}

export function writeCloudBaseRichTextValue($w, html) {
  const component = getCloudBaseComponent($w, ACTIVITY_DESC_EDITOR_COMPONENT_ID);
  if (!component) return false;

  try {
    return setCloudBaseComponentValue(component, normalizeRichTextHtml(html) || '');
  } catch (error) {
    console.warn('写入 CloudBase 富文本编辑器失败:', error);
    return false;
  }
}

export function writeCloudBaseRichTextPreviewValue($w, html, fallbackText = '') {
  const component = getCloudBaseComponent($w, ACTIVITY_DESC_PREVIEW_COMPONENT_ID);
  if (!component) return false;

  try {
    return setCloudBaseComponentValue(component, getRichTextDisplayHtml(html, fallbackText));
  } catch (error) {
    console.warn('写入 CloudBase 富文本展示组件失败:', error);
    return false;
  }
}

export function syncCloudBaseRichTextValueWhenReady($w, html, options = {}) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const {
    maxAttempts = 10,
    delay = 160
  } = options;

  let attempts = 0;
  let timer = 0;

  const run = () => {
    attempts += 1;
    const success = writeCloudBaseRichTextValue($w, html);
    if (success || attempts >= maxAttempts) return;
    timer = window.setTimeout(run, delay);
  };

  run();

  return () => {
    if (timer) {
      window.clearTimeout(timer);
    }
  };
}

export function syncCloudBaseRichTextPreviewWhenReady($w, html, fallbackText = '', options = {}) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const {
    maxAttempts = 10,
    delay = 160
  } = options;

  let attempts = 0;
  let timer = 0;

  const run = () => {
    attempts += 1;
    const success = writeCloudBaseRichTextPreviewValue($w, html, fallbackText);
    if (success || attempts >= maxAttempts) return;
    timer = window.setTimeout(run, delay);
  };

  run();

  return () => {
    if (timer) {
      window.clearTimeout(timer);
    }
  };
}
