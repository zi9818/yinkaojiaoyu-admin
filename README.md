# yinkaojiaoyu-admin

Cloudbase AI Builder project.

## 富文本验收

活动描述当前使用仓库内置的 JSX 富文本编辑器，保存到 `descRich` 后由后台查看页和小程序共同消费。源码侧的本地验收脚本如下：

```bash
npm run verify:richtext
```

脚本会：

- 复用当前仓库的真实富文本工具函数做断言
- 校验后台编辑/查看闭环、摘要生成、小程序富文本 HTML 与图片链接替换
- 生成预览文件 `docs/artifacts/cloudbase-richtext-preview.html`

配套说明见 [docs/cloudbase-richtext-migration.md](./docs/cloudbase-richtext-migration.md)。
