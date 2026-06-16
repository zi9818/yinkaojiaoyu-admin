# 活动描述富文本方案说明

当前项目的“活动描述”已经调整为仓库内置的 JSX 富文本编辑方案，不再依赖 CloudBase 设计器里额外挂载 `WdRichText / RichTextView` 插槽组件。

## 当前方案

- 编辑端使用仓库内置 `RichTextEditor`
- 后台查看使用仓库内置 `RichTextContent`
- 保存链路继续落库 `descRich`
- 摘要链路继续自动生成 `desc`
- 小程序继续优先展示 `descRich`，并保留 `cloud://` 图片链接转换

## 为什么不再走 CloudBase 官方富文本插槽

这次排查里，CloudBase 当前版本设计器虽然能在 JSX 高级属性中声明“组件插槽”，但用户实际界面里没有稳定可用的“把 `WdRichText` / `RichTextView` 真正挂进插槽”的操作入口。

这会导致两个问题：

1. 页面源码已经切到“依赖官方富文本组件实例取值”
2. 设计器里又无法把官方组件稳定挂上

最终表现就是：

- 编辑后保存没有效果
- 重新打开内容丢失
- 换行、列表、引用等结构无法形成完整闭环

因此当前改为使用仓库内置富文本编辑器，先保证“后台编辑 -> 保存 -> 后台查看 -> 小程序展示”链路稳定可用。

## 当前源码中的闭环

### 1. 编辑

活动管理弹窗中的“活动描述”字段直接渲染 `RichTextEditor`，支持：

- 标题
- 加粗 / 斜体 / 下划线
- 有序列表 / 无序列表
- 引用
- 链接
- 文字颜色
- 段落换行

编辑过程中会同步维护：

- `formData.descRich`：完整 HTML
- `formData.desc`：自动提取出的纯文本摘要

### 2. 保存

创建/更新活动时：

- 直接从 `formData.descRich` 读取 HTML
- 通过 `createRichTextSummary(descRich)` 反推摘要
- 保存到数据源字段 `descRich`
- 同步保存 `desc`

### 3. 查看

后台详情弹窗使用 `RichTextContent` 渲染：

- 优先展示 `descRich`
- 老数据只有 `desc` 时自动转换成段落结构

### 4. 小程序展示

小程序首页和订单详情页：

- 优先展示 `descRich`
- 提取富文本中的 `cloud:// / tcb://` 图片
- 转成临时链接后再喂给小程序 `rich-text`

## 本次额外修正

为了修复你提到的“序号不生效、换行不明显”等问题，源码里还补了这些处理：

1. 编辑器和查看组件显式声明 `ol / ul` 的列表样式
2. 富文本规范化结果中保留 `list-style-type`
3. 纯文本回退时保留换行转 `<br />`

## 验收清单

1. 新建活动，输入多段内容后保存
2. 重新打开编辑弹窗，确认内容、换行、列表仍在
3. 后台详情弹窗确认富文本结构正常
4. 小程序首页和订单详情确认换行、列表、图片展示正常

## 相关文件

- [ActivityForm.jsx](/D:/deepwit-edu/code/yinkaojiaoyu-admin/src/components/ActivityForm.jsx)
- [ActivityDialogs.jsx](/D:/deepwit-edu/code/yinkaojiaoyu-admin/src/components/ActivityDialogs.jsx)
- [RichTextEditor.jsx](/D:/deepwit-edu/code/yinkaojiaoyu-admin/src/components/RichTextEditor.jsx)
- [RichTextContent.jsx](/D:/deepwit-edu/code/yinkaojiaoyu-admin/src/components/RichTextContent.jsx)
- [activity-management.jsx](/D:/deepwit-edu/code/yinkaojiaoyu-admin/src/pages/activity-management.jsx)
