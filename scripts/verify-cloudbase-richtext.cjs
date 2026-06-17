const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const miniRepoRoot = path.resolve(repoRoot, '..', 'yinkaojiaoyu');
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cloudbase-richtext-verify-'));

function run(command, cwd) {
  return execSync(command, {
    cwd,
    stdio: 'pipe',
    encoding: 'utf8'
  });
}

function bundleWithEsbuild(entryFile, outfile) {
  // 这里通过 npx 调用 esbuild，把仓库里的 ESM/JSX 工具函数打成临时的 CommonJS，
  // 这样当前脚本就能在 Node 环境里直接 require，并复用真实业务实现做验收。
  run([
    'npx',
    'esbuild',
    `"${entryFile}"`,
    '--bundle',
    '--platform=node',
    '--format=cjs',
    `--outfile="${outfile}"`
  ].join(' '), repoRoot);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readMiniActivitySchema(miniRepoRoot) {
  const legacySchemaPath = path.join(miniRepoRoot, 'database', 'activities-schema.json');
  if (fs.existsSync(legacySchemaPath)) {
    return readJson(legacySchemaPath);
  }

  const cloudBaseSchemaPath = path.join(miniRepoRoot, 'database', 'activitesDatabase.json');
  const cloudBaseSchema = readJson(cloudBaseSchemaPath);
  return {
    fields: Object.entries(cloudBaseSchema?.schema?.properties || {}).map(([name, field]) => ({
      name,
      type: field?.type,
      title: field?.title
    }))
  };
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function createPreviewHtml({ sampleRichHtml, adminPreviewHtml, miniPreviewHtml, fallbackPreviewHtml }) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CloudBase 富文本验收预览</title>
  <link rel="icon" href="data:," />
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #f5f7fb;
      color: #1f2937;
    }
    .page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 32px 24px 48px;
    }
    h1 {
      margin: 0 0 12px;
      font-size: 32px;
    }
    .desc {
      margin: 0 0 24px;
      line-height: 1.7;
      color: #4b5563;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 20px;
    }
    .panel {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
    }
    .panel h2 {
      margin: 0 0 12px;
      font-size: 20px;
    }
    .note {
      font-size: 13px;
      line-height: 1.7;
      color: #6b7280;
      margin-bottom: 16px;
    }
    .preview-surface {
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 16px;
      background: #fff;
      min-height: 240px;
    }
    .mini-surface {
      background: #ffffff;
      border-radius: 14px;
      padding: 16px;
    }
    .mini-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 12px;
      color: #111827;
    }
    .preview-surface img {
      display: block;
      width: 100%;
      max-width: 100%;
      height: auto;
      border-radius: 12px;
    }
    .preview-surface ol,
    .preview-surface ul {
      padding-left: 24px;
    }
    .preview-surface blockquote {
      margin: 12px 0;
      padding: 10px 12px;
      border-left: 4px solid #cbd5e1;
      background: #f8fafc;
      color: #475569;
    }
    pre {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
      font-size: 12px;
      line-height: 1.7;
      color: #334155;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px;
    }
  </style>
</head>
<body>
  <main class="page">
    <h1>CloudBase 富文本验收预览</h1>
    <p class="desc">这个页面由 <code>scripts/verify-cloudbase-richtext.cjs</code> 生成，使用当前仓库的真实富文本工具函数产出后台查看态和小程序展示态的 HTML，用来辅助肉眼验收段落、列表、引用、换行与图片链接转换。</p>
    <section class="grid">
      <article class="panel">
        <h2>原始富文本样例</h2>
        <p class="note">用于模拟 Quill 编辑器保存到 <code>descRich</code> 的 HTML。</p>
        <pre>${escapeHtml(sampleRichHtml)}</pre>
      </article>
      <article class="panel">
        <h2>后台查看态</h2>
        <p class="note">对应 admin 详情弹窗使用的富文本展示结果。</p>
        <div class="preview-surface">${adminPreviewHtml}</div>
      </article>
      <article class="panel">
        <h2>小程序展示态</h2>
        <p class="note">对应小程序首页/订单详情的 <code>rich-text</code> 输入 HTML 近似预览。</p>
        <div class="preview-surface mini-surface">
          <div class="mini-title">活动介绍</div>
          ${miniPreviewHtml}
        </div>
      </article>
      <article class="panel">
        <h2>纯文本回退展示态</h2>
        <p class="note">模拟历史数据只有 <code>desc</code>、没有 <code>descRich</code> 时自动转换出的结构。</p>
        <div class="preview-surface">${fallbackPreviewHtml}</div>
      </article>
    </section>
  </main>
</body>
</html>`;
}

function main() {
  const adminRichTextBundle = path.join(tempDir, 'admin-richText.cjs');

  bundleWithEsbuild(path.join(repoRoot, 'src', 'components', 'richText.js'), adminRichTextBundle);

  const adminRichText = require(adminRichTextBundle);
  const miniRichText = require(path.join(miniRepoRoot, 'utils', 'richText.js'));

  const sampleRichHtml = [
    '<h2>暑期活动说明</h2>',
    '<h4>报名提醒</h4>',
    '<p>第一段保留换行和<em>斜体</em>结构。</p>',
    '<p><s>删除线</s><sub>下标</sub><sup>上标</sup><code>inlineCode</code></p>',
    '<p class="ql-size-large ql-font-serif ql-align-center ql-color-red ql-bg-yellow">大号居中红字黄底</p>',
    '<ol><li>支持序号列表</li><li><span style="color: #2563eb">支持颜色</span></li></ol>',
    '<ul><li data-list="checked">检查清单</li><li data-list="unchecked">待确认项</li></ul>',
    '<blockquote>引用内容也要保留。</blockquote>',
    '<pre data-language="plain">console.log("ok")</pre>',
    '<p><img src="cloud://demo-bucket/richtext/banner.png" alt="活动配图" /></p>'
  ].join('');
  const previewImageUrl = `data:image/svg+xml;utf8,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="720" height="360" viewBox="0 0 720 360"><rect width="720" height="360" rx="28" fill="#E0F2FE"/><rect x="24" y="24" width="672" height="312" rx="22" fill="#F8FAFC"/><text x="50%" y="46%" text-anchor="middle" font-size="34" fill="#0F172A" font-family="Segoe UI, Arial, sans-serif">CloudBase 富文本图片预览</text><text x="50%" y="58%" text-anchor="middle" font-size="20" fill="#475569" font-family="Segoe UI, Arial, sans-serif">用于本地验收预览，避免 cloud:// 在浏览器里直接报错</text></svg>'
  )}`;

  const adminNormalizedHtml = adminRichText.normalizeRichTextHtml(sampleRichHtml);
  assert(adminNormalizedHtml.includes('<ol'), '后台富文本规范化后丢失了有序列表结构');
  assert(adminNormalizedHtml.includes('<blockquote'), '后台富文本规范化后丢失了引用结构');
  assert(adminNormalizedHtml.includes('<em'), '后台富文本规范化后丢失了斜体结构');
  assert(adminNormalizedHtml.includes('<h4'), '后台富文本规范化后丢失了四级标题结构');
  assert(adminNormalizedHtml.includes('<s>删除线</s>'), '后台富文本规范化后丢失了删除线结构');
  assert(adminNormalizedHtml.includes('<sub>下标</sub>') && adminNormalizedHtml.includes('<sup>上标</sup>'), '后台富文本规范化后丢失了上下标结构');
  assert(adminNormalizedHtml.includes('<code>inlineCode</code>'), '后台富文本规范化后丢失了行内代码结构');
  assert(adminNormalizedHtml.includes('data-list="checked"'), '后台富文本规范化后丢失了检查清单状态');
  assert(adminNormalizedHtml.includes('<pre data-language="plain">'), '后台富文本规范化后丢失了代码块结构');
  assert(adminNormalizedHtml.includes('cloud://demo-bucket/richtext/banner.png'), '后台富文本规范化后丢失了云存储图片链接');

  const summary = adminRichText.createRichTextSummary(sampleRichHtml);
  assert(summary.includes('第一段保留换行') && summary.includes('斜体'), '后台摘要生成未提取出正文内容和斜体文字');
  assert(summary.includes('支持序号列表'), '后台摘要生成未提取出列表内容');
  assert(summary.includes('支持颜色'), '后台摘要生成未提取出带样式的列表项内容');
  assert(summary.includes('检查清单') && summary.includes('console.log("ok")'), '后台摘要生成未提取出检查清单或代码块内容');

  const miniPreviewHtml = miniRichText.getRichTextDisplayHtml(sampleRichHtml, summary);
  assert(miniPreviewHtml.includes('<ol'), '小程序展示 HTML 丢失了有序列表结构');
  assert(miniPreviewHtml.includes('<blockquote'), '小程序展示 HTML 丢失了引用结构');
  assert(miniPreviewHtml.includes('list-style-type: decimal'), '小程序展示 HTML 缺少显式有序列表样式');
  assert(miniPreviewHtml.includes('font-size: 1.5em'), '小程序展示 HTML 没有把 Quill 字号 class 转成内联样式');
  assert(miniPreviewHtml.includes('font-family: Georgia, Times New Roman, serif'), '小程序展示 HTML 没有把 Quill 字体 class 转成内联样式');
  assert(miniPreviewHtml.includes('text-align: center'), '小程序展示 HTML 没有把 Quill 居中 class 转成内联样式');
  assert(miniPreviewHtml.includes('color: #e60000'), '小程序展示 HTML 没有把 Quill 默认文字色 class 转成内联样式');
  assert(miniPreviewHtml.includes('background-color: #ffff00'), '小程序展示 HTML 没有把 Quill 默认背景色 class 转成内联样式');
  assert(miniPreviewHtml.includes('☑ 检查清单') && miniPreviewHtml.includes('☐ 待确认项'), '小程序展示 HTML 没有把 Quill 检查清单转成可见标记');
  assert(miniPreviewHtml.includes('vertical-align: sub') && miniPreviewHtml.includes('vertical-align: super'), '小程序展示 HTML 缺少上下标内联样式');

  const fallbackPlainText = '第一行保留换行\n第二行继续展示';
  const richTextImageIds = miniRichText.extractCloudRichTextImageIds(miniPreviewHtml);
  assert(richTextImageIds.length === 1, '小程序富文本云图片提取数量不正确');
  assert(richTextImageIds[0] === 'cloud://demo-bucket/richtext/banner.png', '小程序富文本云图片提取结果不正确');

  const miniResolvedHtml = miniRichText.replaceRichTextImageUrls(miniPreviewHtml, {
    'cloud://demo-bucket/richtext/banner.png': 'https://example.com/richtext/banner.png'
  });
  assert(miniResolvedHtml.includes('https://example.com/richtext/banner.png'), '小程序富文本图片临时链接替换失败');

  const fallbackPreviewHtml = miniRichText.getRichTextDisplayHtml('', fallbackPlainText);
  assert(fallbackPreviewHtml.includes('<br />'), '历史纯文本描述回退时没有保留换行');

  const adminSchema = readJson(path.join(repoRoot, '.datasources', 'activities', 'schema.json'));
  const miniSchema = readMiniActivitySchema(miniRepoRoot);
  const adminDescRichField = (adminSchema.schemas || adminSchema.fields || []).find((field) => field.name === 'descRich');
  const miniDescRichField = (miniSchema.fields || []).find((field) => field.name === 'descRich');
  assert(adminDescRichField && adminDescRichField.type === 'RichText', 'admin 数据源里的 descRich 字段类型不是 RichText');
  assert(miniDescRichField && (miniDescRichField.type === 'RichText' || miniDescRichField.type === 'string'), '小程序数据模型里缺少可存储富文本 HTML 的 descRich 字段');

  const adminMockData = readJson(path.join(repoRoot, '.datasources', 'activities', 'data.json'));
  assert(Array.isArray(adminMockData) && adminMockData.some((item) => typeof item?.descRich === 'string' && item.descRich.trim()), 'admin 本地 datasource 示例数据里缺少 descRich 样例');

  const adminPageSource = fs.readFileSync(path.join(repoRoot, 'src', 'pages', 'activity-management.jsx'), 'utf8');
  const adminFormSource = fs.readFileSync(path.join(repoRoot, 'src', 'components', 'ActivityForm.jsx'), 'utf8');
  const adminDialogSource = fs.readFileSync(path.join(repoRoot, 'src', 'components', 'ActivityDialogs.jsx'), 'utf8');
  const adminEditorSource = fs.readFileSync(path.join(repoRoot, 'src', 'components', 'RichTextEditor.jsx'), 'utf8');
  const adminContentSource = fs.readFileSync(path.join(repoRoot, 'src', 'components', 'RichTextContent.jsx'), 'utf8');
  assert(adminPageSource.includes('normalizeRichTextHtml(formData.descRich)'), '活动管理页保存链路没有直接读取表单富文本值');
  assert(adminFormSource.includes('<RichTextEditor'), '活动表单没有接入内置富文本编辑器');
  assert(adminDialogSource.includes('<RichTextContent html={selectedActivity?.descRich}'), '活动详情弹窗没有使用富文本查看组件');
  assert(adminEditorSource.includes('cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.js'), '富文本编辑器没有接入主 Quill CDN 脚本资源');
  assert(adminEditorSource.includes('cdn.jsdmirror.com/npm/quill@2.0.3/dist/quill.js'), '富文本编辑器没有接入国内 Quill CDN 降级脚本资源');
  assert(adminEditorSource.includes('QUILL_CDN_SOURCES'), '富文本编辑器没有维护 Quill CDN 资源源清单');
  assert(adminEditorSource.includes('className="ql-align"'), '富文本编辑器没有接入 Quill 原生段落对齐控件');
  assert(adminEditorSource.includes('value="justify"'), '富文本编辑器没有接入 Quill 原生两端对齐选项');
  assert(adminEditorSource.includes('className="ql-size"'), '富文本编辑器没有接入 Quill 原生字号控件');
  assert(adminEditorSource.includes('className="ql-background"'), '富文本编辑器没有接入 Quill 原生背景色控件');
  assert(adminEditorSource.includes('className="ql-script"'), '富文本编辑器没有接入 Quill 原生上下标控件');
  assert(adminEditorSource.includes('className="ql-code-block"'), '富文本编辑器没有接入 Quill 原生代码块控件');
  assert(!adminEditorSource.includes('className="ql-font"'), '富文本编辑器不应放出字体选择控件');
  assert(adminEditorSource.includes('value="check"'), '富文本编辑器没有接入 Quill 原生检查清单控件');
  assert(!adminEditorSource.includes('COLOR_SWATCHES'), '富文本编辑器仍在维护自定义颜色数组，没有完全交给 Quill 原生色盘');
  assert(!/(formatText|formatLine|execCommand)\s*\(/.test(adminEditorSource), '富文本编辑器仍存在手写格式命令逻辑');
  assert(adminEditorSource.includes("uploadFile({"), '富文本编辑器没有接入云存储图片上传逻辑');
  assert(adminEditorSource.includes('replaceRichTextImageUrls'), '富文本编辑器没有把 cloud:// 图片替换成临时预览链接');
  assert(adminContentSource.includes('getTempFileURL'), '后台查看组件没有接入 cloud:// 图片临时链接解析');

  const previewDir = path.join(repoRoot, 'docs', 'artifacts');
  fs.mkdirSync(previewDir, { recursive: true });
  const previewFile = path.join(previewDir, 'cloudbase-richtext-preview.html');
  const adminDisplayHtml = adminRichText
    .getRichTextDisplayHtml(sampleRichHtml, summary)
    .replaceAll('cloud://demo-bucket/richtext/banner.png', previewImageUrl);
  const miniDisplayHtml = miniResolvedHtml.replaceAll('https://example.com/richtext/banner.png', previewImageUrl);
  fs.writeFileSync(previewFile, createPreviewHtml({
    sampleRichHtml,
    adminPreviewHtml: adminDisplayHtml,
    miniPreviewHtml: miniDisplayHtml,
    fallbackPreviewHtml
  }), 'utf8');

  console.log('ADMIN_NORMALIZE_OK');
  console.log('ADMIN_QUILL_EDITOR_FLOW_OK');
  console.log('MINIPROGRAM_RICHTEXT_OK');
  console.log('SCHEMA_AND_PAGE_WIRING_OK');
  console.log(`PREVIEW_FILE=${previewFile}`);
  console.log('VERIFY_CLOUDBASE_RICHTEXT_ALL_OK');
}

main();
