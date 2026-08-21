# dsh-theme-pack

DeepSeek Harness（DSH）Web UI 的多主题包插件。内置 8 套流行配色（Tokyo Night、Catppuccin、Claude、GitHub、Dracula、Nord、Rosé Pine、Kanagawa），每套含亮色 + 暗色两个变体，可在 **Settings → Plugins → Theme Pack** 卡片中即时切换。

护眼向推荐：**Rosé Pine**（低饱和玫瑰粉 + 金 + 青，多色调柔和）、**Kanagawa**（Dragon 变体专为深夜低对比设计，Lotus 亮色为暖奶油底）。

## 分类归属

`agents/` — 它是 DSH（AI agent harness）的插件，安装在 `~/.dsh/profiles/web/` profile 中。按 `PROJECTS_LAYOUT.md` 判定流程问题①"给 AI Agent 用的？"归属 agents/。

## 架构

插件分两半，通过 DSH 的 Cordis bundle 机制加载：

| 文件 | 角色 | 加载时机 |
|---|---|---|
| `lib/index.js` | 宿主半：注册 `ui-theme-pack` settings section（zod schema，theme 枚举 + 默认 tokyo-night） | web server 启动时 |
| `lib/client.browser.js` | 浏览器半：8 套配色 × 亮/暗，生成 `--dsw-alias-*` token 覆盖 CSS，注入 `<style>` 标签；注册设置卡片（色板网格 + 下拉框） | 浏览器每次请求现读 |
| `cordis.patch.yml` | bundle 层：向 settings 插入 `ui-theme-pack` 行（默认 `theme: tokyo-night`） | profile 组合时 |

**工作原理**：内置主题引擎 `@deepseek-ai/dsh-client-ui-theme` 的 ThemePresenter 把 token 写成 `body` 的 inline style；本插件用带 `!important` 的 stylesheet 规则压过 inline style，从而换肤。内置的 light/dark/system 偏好（`ui-theme`）不受影响——本插件只改变每种模式下用哪套配色。

**token 覆盖**：每套配色 71 个 `--dsw-alias-*` / `--dsw-specific-*` 变量（亮、暗各一份），含设计系统笔误 token `--dsw-alias-brand-primary-new-colorprimary-new-color`（`dsh-client-ui-trajectory` 在用）和 `--dsw-alias-border-l2-darkmode-thin`（4 个 UI 包在用）。

## 安装

### 用户安装（推荐）

仓库已公开，直接从 GitHub 装，无需软链接。在 profile 的 `package.json` 里登记依赖：

```json
"dependencies": {
  "dsh-theme-pack": "github:MrChenYoung/dsh-theme-pack"
}
```

`dsh.profile.bundles` 数组中加入 `"dsh-theme-pack"`，然后安装：

```bash
cd ~/.dsh/profiles/web && pnpm install
```

pnpm 会从 GitHub 克隆并自动装好依赖（`@deepseek-ai/dsh-settings`、`@deepseek-ai/schemastery`）。装完重启 web server（宿主半在启动时加载）即可在 **Settings → Plugins → Theme Pack** 切换主题。

> 若日后发布到 npm，可改用 `"dsh-theme-pack": "dsh-theme-pack@latest"`。

### 开发安装（软链接，仅维护者）

源码在本目录（唯一事实来源），开发期通过符号链接安装到 DSH profile，改源码刷新即生效：

```
~/.dsh/profiles/web/node_modules/dsh-theme-pack
  -> $HOME/Desktop/Projects/agents/dsh-theme-pack
```

profile 的 `package.json` 中登记（开发期用 `file:` 指向本地源码）：

```json
"dependencies": {
  "dsh-theme-pack": "file:$HOME/Desktop/Projects/agents/dsh-theme-pack"
}
```

`dsh.profile.bundles` 数组中包含 `"dsh-theme-pack"`。

**本目录有自己的 `node_modules/` 和 `pnpm-lock.yaml`**（`pnpm install` 生成，已 gitignore）。这是必须的：Node 加载模块时把软链接解析成真实路径，`lib/index.js` 的 `import '@deepseek-ai/dsh-settings'` 会从本目录往上找依赖，而不是从 profile 的 node_modules 找。所以 `package.json` 里声明了这两个依赖并在本地安装。

**注意**：在 profile 目录跑 `pnpm install --force`（或全新安装）会把软链接替换成硬链接目录，之后改源码不会自动同步（pnpm 普通 install 报 "Already up to date" 不刷新内容）。遇到这种情况重建软链接：

```bash
cd ~/.dsh/profiles/web/node_modules
rm -rf dsh-theme-pack && ln -s $HOME/Desktop/Projects/agents/dsh-theme-pack dsh-theme-pack
```

普通 `pnpm install` 不会动软链接（已验证）。

## 开发工作流

- **改浏览器半**（`lib/client.browser.js`）：保存后**刷新页面即生效**（client bundle 每次请求现读，`cache-control: no-cache`）
- **改宿主半**（`lib/index.js`）或 `cordis.patch.yml`：需要**重启 web server**
- **视觉预览**：`open preview.html`（独立的 mock UI，不依赖 DSH 运行）

## 测试

```bash
node test-css.mjs      # 提取 CSS 生成逻辑，验证 8 套主题 × 71 变量全部合法
node test-browser.mjs  # 假 DOM 冒烟测试：factory + apply() 跑通、style 注入成功
```

## 卸载

```bash
dsh plugin --profile web remove dsh-theme-pack
```

移除后整个 bundle 层消失，UI 回落到内置默认配色。

## 备选方案（未采用）

`dsh-client-ui-theme` 提供官方 token 扩展 API（`theme.overrideTokens()` / `theme.register()`），可不用 `!important`、自动跟随 light/dark/system 解析。当前 CSS 注入方案更自包含、不依赖 theme service，`!important` 是压过 presenter inline style 所必需的。若未来要"更正统"可考虑迁移。
