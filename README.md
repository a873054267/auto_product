# Forgeboard

Forgeboard 是一个 Next.js 全栈工作台，用来记录产品需求迭代，并连接 GitHub 仓库。项目包含：

- Next.js App Router + TypeScript 前端和服务端 API
- SQLite 数据库，用于保存项目、迭代和部署记录
- GitHub 仓库连接和可选的 Personal Access Token 校验
- GitHub Pages 静态前端发布工作流

## 本地运行

要求：Node.js 20 或更高版本，以及 npm。

```bash
npm install
npm run dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)。生产环境可以先验证构建：

```bash
npm run lint
npm run build
npm start
```

SQLite 数据库会自动创建在项目根目录的 `forgeboard.db`。这个文件包含项目数据，不应提交到 GitHub；首次运行时会自动生成。

## 使用说明

1. 在右侧 **GitHub repository** 输入仓库地址，格式可以是 `owner/repository` 或完整的 GitHub URL。
2. 如果仓库是私有仓库，或者需要验证写入权限，请填写 GitHub Personal Access Token。建议使用细粒度 Token，并只授予目标仓库的 `Contents: Read and write` 权限。
3. 点击 **Connect GitHub** 验证仓库并保存仓库名称。
4. 在 **What should we improve next?** 输入新的产品诉求，点击 **Run iteration**。需求会写入 SQLite，并显示在迭代历史中。
5. 连接仓库后点击 **Publish to GitHub Pages**。当前 MVP 会记录发布任务并生成 Pages URL；它还不会自动生成页面文件或调用 GitHub Contents API。

## 架构：前端 Pages，后台独立部署

当前项目已经按这个架构配置：Next.js 只构建静态前端到 `out/`，浏览器通过 `NEXT_PUBLIC_API_BASE_URL` 调用独立后台。后台需要运行 `backend/workspace-route.ts` 对应的 API，并使用 `src/lib/db.ts` 连接独立数据库。

后台 API 至少需要提供：

```text
GET  /api/workspace
POST /api/workspace
```

如果后台域名是 `https://forgeboard-api.example.com`，在 GitHub 仓库中打开 **Settings > Secrets and variables > Actions > Variables**，新增仓库变量：

```text
NEXT_PUBLIC_API_BASE_URL=https://forgeboard-api.example.com
```

后台必须允许 GitHub Pages 域名跨域访问，例如允许：

```text
Access-Control-Allow-Origin: https://<你的用户名>.github.io
Access-Control-Allow-Headers: Content-Type
Access-Control-Allow-Methods: GET, POST, OPTIONS
```

不要把数据库连接密码、GitHub Token 或其他私密信息放入 `NEXT_PUBLIC_*` 变量，因为这些变量会被编译进浏览器 JavaScript。

## 推送到个人 GitHub 仓库

先在 GitHub 创建一个空仓库，例如 `forgeboard`，然后在项目根目录执行：

```bash
git init
git add .
git commit -m "Initial Forgeboard app"
git branch -M main
git remote add origin https://github.com/<你的用户名>/forgeboard.git
git push -u origin main
```

如果当前目录已经是 Git 仓库，只需确认远程地址后执行：

```bash
git remote -v
git add .
git commit -m "Update Forgeboard"
git push
```

不要提交以下内容：

- `forgeboard.db` 及其 SQLite 临时文件
- GitHub Token
- `.env*` 文件中的密钥

## 从 GitHub 部署应用

### 方案 A：Vercel（可作为静态前端托管）

1. 将代码推送到 GitHub。
2. 打开 [Vercel New Project](https://vercel.com/new)，使用 GitHub 登录。
3. 选择刚刚推送的仓库，点击 **Deploy**。
4. 在 Vercel 项目设置的 Environment Variables 中增加 `NEXT_PUBLIC_API_BASE_URL`，值为独立后台地址。
5. Vercel 会自动识别 Next.js，并使用 `npm run build` 构建。
6. 部署完成后，使用 Vercel 提供的域名访问应用，并将该域名加入后台 CORS 白名单。

当前项目使用本地 SQLite，Vercel 不负责托管这份数据库。正式环境应将 `src/lib/db.ts` 的数据库实现替换为 PostgreSQL、Turso、Neon 或其他云数据库，并将 API 独立部署。

### 方案 B：带持久磁盘的 Node.js 主机

如果需要继续使用 SQLite，可以部署到拥有持久磁盘的 VPS、Railway、Render Persistent Disk 等 Node.js 主机：

```bash
npm ci
npm run build
npm start
```

生产进程应绑定 `0.0.0.0` 并由平台提供的 `PORT` 启动。确保应用运行目录可写，并对 `forgeboard.db` 做定期备份。部署完成后，使用域名访问平台分配的服务地址。

## 将前端发布到 GitHub Pages

GitHub Pages 只能托管静态文件，所以只发布前端。仓库已经包含 `.github/workflows/deploy-pages.yml`，按以下步骤启用：

1. 把代码推送到 GitHub 的 `main` 分支。
2. 在仓库的 **Settings > Pages > Build and deployment** 中，将 **Source** 设置为 **GitHub Actions**。
3. 确认仓库变量 `NEXT_PUBLIC_API_BASE_URL` 已配置。
4. 打开 **Actions**，运行 **Deploy static frontend to GitHub Pages**，或再次向 `main` 推送代码。
5. 部署完成后访问 `https://<你的用户名>.github.io/<仓库名>/`。

如果 Pages 使用自定义域名，请把跨域白名单中的来源替换为自定义域名。GitHub Pages 的工作流会自动读取 `out/` 并发布，不需要手动上传文件。

### 解决 `Domain is not a valid public domain` 错误

如果你在 **Settings > Pages > Custom domain** 看到这个错误，请按下面规则填写：

- 不使用自定义域名时，将 **Custom domain** 留空，不要填写 `localhost:3000`、后台 API 地址、`https://`、仓库路径或完整 Pages URL。
- 使用自定义域名时，只填写真实域名，例如 `www.example.com` 或 `example.com`。
- 不要填写 `www.example.com/path`、`example.com:3000`、IP 地址、`localhost` 或 `https://example.com`。
- 自定义域名必须先在域名服务商处配置 DNS，然后再保存到 GitHub Pages。

如果只是想使用 GitHub 提供的免费地址，请保持 Custom domain 为空，并访问：

```text
https://<你的用户名>.github.io/<仓库名>/
```

`NEXT_PUBLIC_API_BASE_URL` 是后台 API 配置，应该放在 **Settings > Secrets and variables > Actions > Variables**，不能填入 Custom domain。

GitHub Pages 不能运行以下服务端内容：

- `/api/workspace` 服务端 API
- `better-sqlite3` 本地数据库
- GitHub Token 校验逻辑

所以数据库和 API 必须单独部署。推荐把后台部署到 Railway、Render、Fly.io、VPS 或其他 Node.js 主机，并将数据库换成 PostgreSQL、Turso、Neon 等云数据库。

应用内的 **Publish to GitHub Pages** 按钮目前仅记录队列状态并生成地址；它不会替代上面的 GitHub Actions 工作流，也不会自动将用户生成的页面文件推送到另一个仓库。要实现真正的自动发布，还需要在后台增加 GitHub OAuth 或安全 Token 存储、Contents API 文件提交、Pages 配置接口以及部署状态轮询。

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 启动开发服务器 |
| `npm run lint` | 检查代码规范 |
| `npm run build` | 创建生产构建 |
| `npm start` | 启动生产服务器 |
