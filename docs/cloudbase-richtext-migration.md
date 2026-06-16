# CloudBase 官方富文本迁移说明

本项目的“活动描述”已按 CloudBase 官方富文本组件的接入方式改造为“插槽 + `$w` 组件实例桥接”。

## 目标

- 编辑端使用官方 `WdRichText`
- 后台查看使用官方 `RichTextView`
- 保存链路继续落库 `descRich`
- 摘要链路继续自动生成 `desc`
- 小程序继续展示 `descRich`，并补齐 `cloud://` 图片转换

## 需要在 CloudBase JSX 页面里完成的配置

> 说明：JSX 组件的插槽声明配置不落在当前仓库源码中，需要在 CloudBase / AI Builder 页面编辑器里手动补一次。

### 1. 在活动管理页 JSX 组件高级属性中声明两个插槽

```json
[
  { "name": "活动描述编辑", "id": "descEditorSlot" },
  { "name": "活动描述展示", "id": "descPreviewSlot" }
]
```

### 2. 在 `descEditorSlot` 中拖入官方 `WdRichText`

- 组件名称：`WdRichText`
- 组件 ID：`activityDescRichEditor`

### 3. 在 `descPreviewSlot` 中拖入官方 `RichTextView`

- 组件名称：`RichTextView`
- 组件 ID：`activityDescRichPreview`

## 当前源码中的约定

- 编辑组件实例 ID：`activityDescRichEditor`
- 展示组件实例 ID：`activityDescRichPreview`

源码会在弹窗打开后自动：

1. 优先通过官方组件 Method API（`setValue` / `clearValue`）把当前 `descRich` 回填给官方富文本编辑器
2. 保存时直接读取 `activityDescRichEditor.value`
3. 查看详情时把 `descRich` / `desc` 回填给 `RichTextView`

如果页面还没有把官方富文本插槽真正挂上，源码现在会直接拦截创建/更新操作，并提示先完成 `slotList + WdRichText` 配置，避免出现“界面看起来能编辑，但保存后没有效果”的假象。

## 验收清单

1. 新建活动时输入多段落、标题、列表、图片后保存
2. 重新打开编辑弹窗，确认样式和换行仍在
3. 后台详情弹窗确认 `RichTextView` 展示正常
4. 小程序首页和订单详情确认富文本换行、列表、图片展示正常

## 官方参考

- WdRichText 组件文档：<https://docs.cloudbase.net/en/lowcode/components/wedaUI/src/docs/compsdocs/form/WdRichText>
- RichTextView 组件文档：<https://docs.cloudbase.net/en/lowcode/components/wedaUI/src/docs/compsdocs/show/RichTextView>
