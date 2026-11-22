# Codex Markdown 阅读增强

在 Codex 桌面端文件面板阅读 Markdown。短标签列随内容收紧，长说明换行，宽表在窄面板内横向滚动。正文、标题、代码、列表和引用采用适合阅读的排版。

## 独立阅读器

独立阅读器通过 [OpenAI 文件查看器扩展](https://developers.openai.com/plugins/build/extensions#file-viewers-and-editors) 打开 `.md` 和 `.markdown` 文件，安装到 Codex，无需 Codex Tweaks。文件打开即显示正文。支持文件更新通知的客户端会在原文件变化后自动刷新预览。

### 安装

环境要求为支持文件查看器扩展的 Codex 桌面端、macOS 或 Linux，以及 Node.js 22 或更新版本。已在 macOS 上的 ChatGPT 桌面端 26.1117.41037 验证自定义 Markdown 文件面板，并核对只读版的桌面后台发现。只读界面、窄面板和更新通知在 Chromium 中验证。

```sh
codex plugin marketplace add cainebaode/codex-tweaks-markdown-reader
codex plugin add codex-markdown-reader@codex-markdown-reader
```

完全退出并重新打开桌面端。打开 Markdown 文件，出现查看器选择时选择「Markdown 阅读器」。也可在文件面板「打开」菜单的「在 ChatGPT 中打开」区段切换查看器。停用时在插件页关闭「Markdown 阅读器」，或运行 `codex plugin remove codex-markdown-reader@codex-markdown-reader`。

更新时运行 `codex plugin marketplace upgrade codex-markdown-reader`，再运行安装命令并重新打开桌面端。安装包包含构建产物。Node.js 用于启动本地插件，使用者无需另行安装 npm 依赖。

### 阅读范围

- 使用 Codex 提供的已打开文件资源来显示正文，支持 GitHub 风格表格、任务列表、删除线、文内标题链接和 HTTP(S) 链接。
- 以只读方式运行。Markdown 图片显示替代文字，原始 HTML 按文字展示，相对文件链接显示为文字。
- 本地 MCP 进程只读取内置查看器界面，Markdown 由 Codex 提供给界面。读取和更新均走宿主资源接口，无远程服务。

## Codex Tweaks 兼容版

仓库根目录仍提供 `ct-markdown-reader` 功能包，适用于希望继续使用 Codex 内置文件预览的用户。它调整现有预览的表格、段落间距和文字字重。

### 安装

1. 在 Codex Tweaks 的「功能包」页面选择「从 Git 安装」，输入仓库地址 `https://github.com/cainebaode/codex-tweaks-markdown-reader.git`，并按提示选择版本或分支。
2. 安装后编译并启用 `ct-markdown-reader`。新安装的功能包默认停用。
3. 在 Codex 打开 Markdown 文件预览，即可查看效果。

也可以下载或克隆仓库，在「功能包」页面选择「安装本地包」，选中包含 `package.json` 的目录，然后编译并启用。

### 更新与停用

通过 Git 安装时，在 Codex Tweaks 功能包页面检查更新并按提示更新。修改本地源码后，点击「重新编译」使修改生效。关闭功能包开关可停用，重新启用可恢复效果。

### 权限与兼容性

- 功能包在渲染进程读取 Markdown 预览中的已渲染内容，用于计算表格列宽和识别加粗样式。它添加样式和监听器，不保存文档内容。
- 不使用 Node 后端、网络请求或 npm 依赖。
- 列宽根据当前已渲染的行计算。编辑中的不完整表格保留原有布局，超长表格滚动时列宽可能随当前行变化。
- 已在 macOS 的 Codex Markdown 预览中核对中文流程表和三列对照表，并在 Chromium 中验证窄窗口、长链接、编辑及停用。其他平台和客户端版本尚未验证。客户端内部结构变化可能需要适配。

## 开发

独立版位于 `plugins/reader`。在该目录运行 `npm ci` 和 `npm run build` 更新可安装产物。在仓库根目录以 `codex plugin marketplace add .` 注册开发版本，再按安装步骤加载。使用合成 Markdown 文件检查短列、长说明、窄窗口、自动刷新及外部链接。

Codex Tweaks 兼容版由根目录的 `index.js` 和 `reader.css` 实现。修改后在 Codex Tweaks 中重新编译。

## 许可证

MIT，见 [LICENSE](LICENSE)。独立查看器的参考实现及构建依赖的许可说明见 [参考实现](plugins/reader/NOTICE-CJK-PDF-Viewer) 和 [依赖许可](plugins/reader/dist/THIRD-PARTY-NOTICES.txt)。
