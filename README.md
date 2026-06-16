# yinkaojiaoyu-admin

Cloudbase AI Builder project.

## 富文本验收

活动描述已经切到 CloudBase 官方 `WdRichText + RichTextView` 方案，源码侧的本地验收脚本如下：

```bash
npm run verify:richtext
```

脚本会：

- 复用当前仓库的真实富文本工具函数做断言
- 校验 CloudBase 桥接写入、摘要生成、小程序富文本 HTML 与图片链接替换
- 生成预览文件 `docs/artifacts/cloudbase-richtext-preview.html`

配套说明见 [docs/cloudbase-richtext-migration.md](./docs/cloudbase-richtext-migration.md)。
