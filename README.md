# Lehuang's Blog

个人技术博客，使用 Astro 构建静态站点，部署在 Cloudflare Pages。文章源在独立的 [`MyBlog-content`](https://github.com/Lehuang0212/MyBlog-content) 仓库，构建时自动同步。

## 技术栈

- Astro 7（静态输出，无运行时）
- 原生 CSS + 设计 token，浅色/深色两套主题
- Expressive Code（代码高亮、复制按钮、明暗双主题）
- `@astrojs/rss`、`@astrojs/sitemap`
- Cloudflare Pages（全球 CDN、HTTPS、预览部署）
- 内容同步：`scripts/sync-content.mjs` 克隆/更新 `MyBlog-content`

## 本地开发

```bash
npm install
npm run dev
```

`dev` 和 `build` 之前会自动运行 `sync:content`，把文章仓库克隆到 `src/content/blog/`。这个目录已被 `.gitignore` 忽略，不要直接在里面写文章。

```bash
npm run build     # 生成 dist/
npm run preview   # 预览构建结果
npm run check     # Astro/TypeScript 检查
```

## 内容格式

文章是普通 Markdown，推荐 frontmatter：

```yaml
---
title: Linux基础
date: "2026-06-15T00:00:00+08:00"
tags:
  - Linux
  - RHEL
description: 一句话摘要，用于列表、SEO 和 RSS。
slug: linux-basics
draft: false
---
```

字段说明：

- `title`：缺省时使用文件名。
- `date`：建议用带时区的 ISO 8601 并加引号。旧文章里不带时区的写法会被当作 Asia/Shanghai 时间处理。
- `tags`：用于标签页；缺省为空。
- `description`：缺省时自动截取正文（优先取 `<!-- more -->` 之前的内容）。
- `slug`：可选，建议用英文短名；缺省时使用文件路径，中文文件名会生成百分号编码的 URL。
- `draft`：`true` 时只在开发环境显示，生产构建会跳过。

目录结构会映射为分类：`Linux/` → `/categories/linux/`，`Project/` → `/categories/project/`。

## 目录结构

```text
src/
├─ components/          # Header、Footer、PostCard、TOC、主题切换
├─ content.config.ts    # 内容集合与 frontmatter schema
├─ consts.ts            # 站点信息、导航
├─ layouts/             # BaseLayout、PostLayout
├─ lib/posts.ts         # 排序、标签、上下篇、日期、摘要
├─ pages/               # 首页、归档、文章、标签、分类、关于、404、RSS
├─ styles/global.css    # 设计 token、布局、prose、响应式
└─ content/blog/        # 构建时生成，已 gitignore
scripts/
├─ sync-content.mjs     # 同步文章仓库
└─ generate-assets.mjs  # 从 SVG 生成 OG 图和 touch icon
public/
├─ favicon.svg
├─ og-default.png
├─ apple-touch-icon.png
├─ site.webmanifest
└─ _headers
docs/
└─ content-repo-workflow.yml  # 内容仓库自动触发模板
```

## 主题

- 默认浅色，首次访问不跟随系统。
- 右上角太阳/月亮按钮切换；选择写入 `localStorage`，刷新不闪。
- `<html data-theme="light|dark">` 驱动两套 CSS token。
- Expressive Code 使用 `github-light` / `github-dark`，跟随同一个按钮切换。
- 无 JS 时回退到浅色。

## Cloudflare Pages 部署

### 1. 创建项目

连接 GitHub 仓库 `Lehuang0212/MyBlog-code`，生产分支 `main`，然后设置：

```text
Framework preset: Astro
Build command:    npm run build
Output directory: dist
Node version:     22（环境变量 NODE_VERSION=22）
```

再添加环境变量：

```text
SITE_URL=https://你的域名
```

`SITE_URL` 用于 canonical、sitemap、RSS 和 OG 链接。没有设置时回退到 `https://lehuang.me`（占位域名）。本地开发也可以直接改 `astro.config.mjs` 和 `src/consts.ts` 里的默认值。

### 2. 首次构建

Pages 会自动执行 `npm install` 和 `npm run build`。构建时 `sync-content.mjs` 克隆最新的 `MyBlog-content`，生成 `dist/`。如果构建失败，Pages 会保留上一个成功部署。

### 3. 内容更新自动触发

Pages 只监听代码仓库，文章仓库的 push 不会自动触发构建，需要 Deploy Hook：

1. Pages 项目 → **Settings → Builds & deployments → Deploy hooks**，创建一个 hook，分支选 `main`，复制 URL。
2. 打开 `MyBlog-content` 仓库 → **Settings → Secrets and variables → Actions**，新增 secret：`CF_PAGES_DEPLOY_HOOK`，值为刚才的 URL。
3. 把 `docs/content-repo-workflow.yml` 复制到内容仓库的 `.github/workflows/trigger-pages.yml`，提交并 push。
4. 之后每次 push 到内容仓库 `main` 的 Markdown，都会调用 hook，Pages 重新构建并拉取最新内容。

工作流里对空 secret 做了保护：没有配置 hook 时会跳过，不会制造失败记录。

### 4. 域名

域名暂时未购买。确定后：

1. 在 Pages → **Custom domains** 添加域名，按提示完成 DNS/HTTPS。
2. 把 `SITE_URL` 改成正式域名（Pages 环境变量或代码里的默认值）。
3. 重新构建一次，让 canonical/sitemap/RSS 使用新域名。

## 常见维护

```bash
# 只同步内容，不构建
npm run sync:content

# 重新生成 OG 图 / touch icon
node scripts/generate-assets.mjs
```

### 图片

文章图片目前使用 jsDelivr：

```text
https://cdn.jsdelivr.net/gh/Lehuang0212/blog-images/...
```

如果国内访问不稳定，可以把图片迁到 Cloudflare R2 或放进 `public/images/`，再替换文章里的 URL。

### 内容待补

当前旧文章里有 5 篇没有 `date`，列表会显示“日期待补”，归档会归到“未标注年份”。补上 frontmatter 的 `date`、`tags`、`description` 即可自动改善列表、归档和 SEO；不需要改代码。

## 尚未加入

- 评论（可加 giscus）
- 站内搜索（可加 Pagefind）
- 访问统计（可加 Cloudflare Web Analytics）

这些都保持可选，先保证静态阅读和内容更新链路稳定。
