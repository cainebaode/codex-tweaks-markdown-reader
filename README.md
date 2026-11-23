# Codex Markdown 阅读增强

Codex Tweaks 功能包，改善 Codex 桌面端 Markdown 文件预览的表格、文字和间距。

功能包增强 Codex 内置查看器，保留带行号的文件跳转和原生批注。批注可随下一条对话发送。

## 功能

- 表格按内容确定宽度，短标签列收紧，长说明自动换行，同一表格各行对齐。窄窗口中表格随可用空间收缩。
- 正文采用常规字重，增强标题与行内加粗的对比，调整段落、列表和标题间距。
- 表格颜色适配浅色和深色主题。

## 环境要求

- 已安装并启用 [Codex Tweaks](https://github.com/codex-tweaks/codex-tweaks)，使用 API v3 功能包。
- Codex 桌面端。当前实现依据本机 ChatGPT 26.1117.41037 的 CodeMirror 文件预览结构适配。

## 安装

如果曾安装本仓库的独立「Markdown 阅读器」，在 Codex 的「设置 → 查看器 → 文件」中将 `.md` 设为「内置」，并在插件页卸载独立阅读器。

1. 在 Codex Tweaks 的「功能包」页面选择「从 Git 安装」，输入本仓库地址 `https://github.com/cainebaode/codex-tweaks-markdown-reader.git`，并按提示选择版本或分支。
2. 安装后编译并启用 `ct-markdown-reader`。新安装的功能包默认停用。
3. 在 Codex 打开 Markdown 文件预览，即可查看效果。

也可以下载或克隆仓库，在「功能包」页面选择「安装本地包」，选中包含 `package.json` 的目录，然后编译并启用。

## 更新与停用

通过 Git 安装时，在 Codex Tweaks 功能包页面检查更新并按提示更新。修改本地源码后，点击「重新编译」使修改生效。关闭功能包开关可停用，重新启用可恢复效果。

## 权限与兼容性

- 功能包在渲染进程读取 Markdown 预览中的已渲染内容，用于计算表格列宽和识别加粗样式。它添加样式和监听器，不保存文档内容。
- 不使用 Node 后端、网络请求或 npm 依赖。
- 列宽根据当前已渲染的行计算。编辑中的不完整表格保留原有布局，超长表格滚动时列宽可能随当前行变化。
- 已在 macOS 的 Codex Markdown 预览中核对中文流程表和三列对照表，并在 Chromium 中验证窄窗口、长链接、编辑及停用。其他平台和客户端版本尚未验证。客户端内部结构变化可能需要适配。

## 开发

`index.js` 实现预览识别和动态列宽，`reader.css` 定义排版样式。修改后在 Codex Tweaks 中重新编译，并检查预览、编辑及停用恢复。

## 许可证

MIT，详见 [LICENSE](LICENSE)。
