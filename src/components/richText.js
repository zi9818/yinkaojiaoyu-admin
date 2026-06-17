const DEFAULT_STYLES = {
  p: {
    margin: '0 0 12px',
    'line-height': '1.8',
    color: '#333333'
  },
  div: {
    margin: '0 0 12px',
    'line-height': '1.8',
    color: '#333333'
  },
  h1: {
    margin: '0 0 14px',
    'font-size': '24px',
    'font-weight': '700',
    'line-height': '1.4',
    color: '#111827'
  },
  h2: {
    margin: '0 0 14px',
    'font-size': '20px',
    'font-weight': '700',
    'line-height': '1.5',
    color: '#111827'
  },
  h3: {
    margin: '0 0 12px',
    'font-size': '18px',
    'font-weight': '600',
    'line-height': '1.5',
    color: '#111827'
  },
  h4: {
    margin: '0 0 10px',
    'font-size': '16px',
    'font-weight': '600',
    'line-height': '1.5',
    color: '#111827'
  },
  h5: {
    margin: '0 0 10px',
    'font-size': '14px',
    'font-weight': '600',
    'line-height': '1.5',
    color: '#111827'
  },
  h6: {
    margin: '0 0 10px',
    'font-size': '12px',
    'font-weight': '600',
    'line-height': '1.5',
    color: '#111827'
  },
  ul: {
    margin: '0 0 12px',
    padding: '0 0 0 20px',
    color: '#333333',
    'list-style-type': 'disc'
  },
  ol: {
    margin: '0 0 12px',
    padding: '0 0 0 20px',
    color: '#333333',
    'list-style-type': 'decimal'
  },
  li: {
    margin: '0 0 8px',
    'line-height': '1.8'
  },
  blockquote: {
    margin: '0 0 12px',
    padding: '8px 12px',
    'border-left': '4px solid #d1d5db',
    'background-color': '#f9fafb',
    color: '#4b5563'
  },
  img: {
    display: 'block',
    'max-width': '100%',
    height: 'auto',
    margin: '12px 0',
    'border-radius': '12px'
  },
  a: {
    color: '#2563eb',
    'text-decoration': 'underline'
  },
  pre: {
    margin: '0 0 12px',
    padding: '12px',
    'border-radius': '8px',
    'background-color': '#111827',
    color: '#f9fafb',
    'white-space': 'pre-wrap',
    'word-break': 'break-word'
  },
  code: {
    padding: '2px 4px',
    'border-radius': '4px',
    'background-color': '#f3f4f6',
    'font-family': 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    'font-size': '0.9em'
  }
};

const RICH_TEXT_IMAGE_SRC_REGEXP = /<img\b([^>]*?)\bsrc=(['"])(.*?)\2([^>]*)>/gi;

const ALLOWED_TAGS = new Set([
  'P',
  'BR',
  'DIV',
  'STRONG',
  'B',
  'EM',
  'I',
  'U',
  'S',
  'STRIKE',
  'SUB',
  'SUP',
  'UL',
  'OL',
  'LI',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'BLOCKQUOTE',
  'PRE',
  'CODE',
  'A',
  'SPAN',
  'IMG'
]);

const DROP_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'IFRAME',
  'OBJECT',
  'EMBED',
  'FORM',
  'INPUT',
  'BUTTON',
  'TEXTAREA',
  'SELECT',
  'OPTION',
  'META',
  'LINK'
]);

const ALLOWED_STYLE_PROPS = new Set([
  'color',
  'background-color',
  'font-weight',
  'font-style',
  'text-decoration',
  'text-align',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding',
  'padding-left',
  'padding-right',
  'padding-top',
  'padding-bottom',
  'line-height',
  'font-size',
  'font-family',
  'vertical-align',
  'white-space',
  'word-break',
  'display',
  'max-width',
  'height',
  'width',
  'list-style-type',
  'border-left',
  'border-radius'
]);

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseStyleText(styleText) {
  const styleMap = {};
  String(styleText || '')
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => {
      const colonIndex = item.indexOf(':');
      if (colonIndex <= 0) return;
      const key = item.slice(0, colonIndex).trim().toLowerCase();
      const value = item.slice(colonIndex + 1).trim();
      if (!key || !value) return;
      if (!ALLOWED_STYLE_PROPS.has(key)) return;
      styleMap[key] = value;
    });
  return styleMap;
}

function styleMapToText(styleMap) {
  return Object.entries(styleMap || {})
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim())
    .map(([key, value]) => `${key}: ${String(value).trim()}`)
    .join('; ');
}

function sanitizeUrl(value, options = {}) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const lower = raw.toLowerCase();

  if (raw.startsWith('/') || raw.startsWith('./') || raw.startsWith('../')) {
    return raw;
  }

  if (options.image && lower.startsWith('data:image/')) {
    return raw;
  }

  if (lower.startsWith('http://') || lower.startsWith('https://') || lower.startsWith('cloud://') || lower.startsWith('tcb://')) {
    return raw;
  }

  return '';
}

function sanitizeClassName(value) {
  const allowedClasses = String(value || '')
    .split(/\s+/)
    .map((item) => item.trim())
    // 这里只保留 Quill 官方格式 class，避免外部 class 影响后台页面样式或注入无关表现。
    .filter((item) => /^ql-(size|font|align|direction|indent|color|bg)-[a-z0-9_-]+$/i.test(item));
  return allowedClasses.join(' ');
}

function sanitizeDataAttribute(tag, name, value) {
  const normalizedValue = String(value || '').trim();
  if (tag === 'LI' && name === 'data-list') {
    return /^(checked|unchecked|bullet|ordered)$/i.test(normalizedValue) ? normalizedValue.toLowerCase() : '';
  }
  if (tag === 'PRE' && name === 'data-language') {
    return /^[a-z0-9_-]{1,32}$/i.test(normalizedValue) ? normalizedValue : '';
  }
  return '';
}

function unwrapElement(element) {
  const parent = element.parentNode;
  if (!parent) return;
  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element);
  }
  parent.removeChild(element);
}

function applyDefaultStyles(element) {
  const tag = String(element.tagName || '').toLowerCase();
  const nextStyles = {
    ...(DEFAULT_STYLES[tag] || {}),
    ...parseStyleText(element.getAttribute('style') || '')
  };
  const styleText = styleMapToText(nextStyles);
  if (styleText) {
    element.setAttribute('style', styleText);
  } else {
    element.removeAttribute('style');
  }
}

function sanitizeNodeTree(root) {
  const children = Array.from(root.childNodes || []);
  children.forEach((node) => {
    if (!node) return;

    if (node.nodeType === 8) {
      root.removeChild(node);
      return;
    }

    if (node.nodeType !== 1) {
      return;
    }

    const element = node;
    const tag = String(element.tagName || '').toUpperCase();

    if (DROP_TAGS.has(tag)) {
      root.removeChild(element);
      return;
    }

    if (!ALLOWED_TAGS.has(tag)) {
      sanitizeNodeTree(element);
      unwrapElement(element);
      return;
    }

    Array.from(element.attributes || []).forEach((attr) => {
      const name = String(attr.name || '').toLowerCase();
      const value = attr.value;

      if (!name) return;

      if (name.startsWith('on')) {
        element.removeAttribute(attr.name);
        return;
      }

      if (name === 'style') {
        return;
      }

      if (name === 'class') {
        const safeClassName = sanitizeClassName(value);
        if (safeClassName) {
          element.setAttribute('class', safeClassName);
        } else {
          element.removeAttribute(attr.name);
        }
        return;
      }

      if (name.startsWith('data-')) {
        const safeDataValue = sanitizeDataAttribute(tag, name, value);
        if (safeDataValue) {
          element.setAttribute(attr.name, safeDataValue);
        } else {
          element.removeAttribute(attr.name);
        }
        return;
      }

      if (tag === 'A' && name === 'href') {
        const safeHref = sanitizeUrl(value);
        if (safeHref) {
          element.setAttribute('href', safeHref);
        } else {
          element.removeAttribute('href');
        }
        return;
      }

      if (tag === 'IMG' && name === 'src') {
        const safeSrc = sanitizeUrl(value, { image: true });
        if (safeSrc) {
          element.setAttribute('src', safeSrc);
        } else {
          element.removeAttribute('src');
        }
        return;
      }

      if (tag === 'IMG' && name === 'alt') {
        return;
      }

      if (tag === 'A' && (name === 'target' || name === 'rel')) {
        return;
      }

      element.removeAttribute(attr.name);
    });

    if (tag === 'A' && element.getAttribute('href')) {
      element.setAttribute('target', '_blank');
      element.setAttribute('rel', 'noopener noreferrer');
    }

    if (tag === 'IMG') {
      if (!element.getAttribute('src')) {
        root.removeChild(element);
        return;
      }
      if (!element.getAttribute('alt')) {
        element.setAttribute('alt', 'image');
      }
    }

    applyDefaultStyles(element);
    sanitizeNodeTree(element);
  });
}

export function sanitizeRichTextHtml(html) {
  const raw = String(html || '').trim();
  if (!raw) return '';

  if (typeof document === 'undefined') {
    return raw
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
      .replace(/\son\w+="[^"]*"/gi, '')
      .replace(/\son\w+='[^']*'/gi, '')
      .replace(/javascript:/gi, '');
  }

  const container = document.createElement('div');
  container.innerHTML = raw;
  sanitizeNodeTree(container);
  return container.innerHTML.trim();
}

export function extractTextFromRichText(html) {
  const raw = String(html || '').trim();
  if (!raw) return '';

  if (typeof document === 'undefined') {
    return raw
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li|h1|h2|h3|h4|h5|h6|blockquote|pre)>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();
  }

  const container = document.createElement('div');
  container.innerHTML = sanitizeRichTextHtml(raw);
  const text = typeof container.innerText === 'string' ? container.innerText : container.textContent || '';
  return text
    .replace(/\u00a0/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

export function hasRichTextMedia(html) {
  return /<(img)\b/i.test(String(html || ''));
}

export function createRichTextSummary(html) {
  const text = extractTextFromRichText(html);
  if (text) return text;
  return hasRichTextMedia(html) ? '[图片内容]' : '';
}

export function normalizeRichTextHtml(html) {
  const sanitized = sanitizeRichTextHtml(html);
  if (!sanitized) return '';
  const text = extractTextFromRichText(sanitized);
  if (!text && !hasRichTextMedia(sanitized)) {
    return '';
  }
  return sanitized;
}

export function convertPlainTextToRichText(text) {
  const raw = String(text || '').trim();
  if (!raw) return '';
  const paragraphs = raw.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
  return paragraphs
    .map((item) => `<p style="${styleMapToText(DEFAULT_STYLES.p)}">${escapeHtml(item).replace(/\n/g, '<br />')}</p>`)
    .join('');
}

export function getRichTextDisplayHtml(descRich, desc) {
  const richHtml = normalizeRichTextHtml(descRich);
  if (richHtml) return richHtml;
  return convertPlainTextToRichText(desc);
}

export function extractCloudRichTextImageIds(html) {
  const raw = String(html || '').trim();
  if (!raw) return [];

  const ids = [];
  let match = null;
  while ((match = RICH_TEXT_IMAGE_SRC_REGEXP.exec(raw)) !== null) {
    const src = String(match[3] || '').trim();
    if (!src) continue;
    if (!src.startsWith('cloud://') && !src.startsWith('tcb://')) continue;
    if (!ids.includes(src)) {
      ids.push(src);
    }
  }
  RICH_TEXT_IMAGE_SRC_REGEXP.lastIndex = 0;
  return ids;
}

export function replaceRichTextImageUrls(html, urlMap) {
  const raw = String(html || '');
  if (!raw) return '';

  const safeUrlMap = urlMap || {};
  return raw.replace(RICH_TEXT_IMAGE_SRC_REGEXP, (match, before = '', quote = '"', src = '', after = '') => {
    const normalizedSrc = String(src || '').trim();
    const nextSrc = safeUrlMap[normalizedSrc];
    if (!nextSrc) return match;
    return `<img${before}src=${quote}${nextSrc}${quote}${after}>`;
  });
}
