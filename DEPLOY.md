# 教育管理平台 - 部署指南

本指南介绍如何将教育管理平台部署到以下平台：
- **数据库**: Supabase (PostgreSQL)
- **后端**: Render (Node.js)
- **前端**: Netlify (静态站点)

---

## 目录

1. [前置准备](#1-前置准备)
2. [Supabase 数据库设置](#2-supabase-数据库设置)
3. [GitHub 仓库创建与推送](#3-github-仓库创建与推送)
4. [Render 后端部署](#4-render-后端部署)
5. [Netlify 前端部署](#5-netlify-前端部署)
6. [部署后验证](#6-部署后验证)
7. [常见问题排查](#7-常见问题排查)

---

## 1. 前置准备

在开始部署前，请确保：

- 已安装 [Git](https://git-scm.com/)
- 已注册 [Supabase](https://supabase.com/) 账号
- 已注册 [Render](https://render.com/) 账号
- 已注册 [Netlify](https://netlify.com/) 账号
- 已注册 [GitHub](https://github.com/) 账号
- 项目在本地已能正常运行（`npm run dev`）

---

## 2. Supabase 数据库设置

### 2.1 创建 Supabase 项目

1. 登录 [Supabase Dashboard](https://app.supabase.com/)
2. 点击 **"New Project"**
3. 填写以下信息：
   - **Organization**: 选择或创建一个组织
   - **Project name**: `edu-management-db`
   - **Database Password**: 设置一个强密码（请记住此密码）
   - **Region**: 选择 `Northeast Asia (Tokyo)` 或 `Southeast Asia (Singapore)`
4. 点击 **"Create new project"**，等待项目创建完成（约 2-3 分钟）

### 2.2 获取数据库连接字符串

1. 在 Supabase 项目页面，进入 **Settings** > **Database**
2. 在 **Connection string** 部分，选择 **URI** 格式
3. 复制连接字符串，格式如下：

```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6532/postgres
```

> **重要**: 请将 `[YOUR-PASSWORD]` 替换为你在创建项目时设置的数据库密码。同时将端口 `6532` 改为 `5432`（如果 Render 连接时遇到问题）。

### 2.3 记录数据库 URL

将以下信息保存好，后续配置 Render 时需要用到：

```
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6532/postgres
```

---

## 3. GitHub 仓库创建与推送

### 3.1 创建 GitHub 仓库

1. 登录 [GitHub](https://github.com/)
2. 点击右上角 **"+"** > **"New repository"**
3. 填写以下信息：
   - **Repository name**: `edu-management-platform`
   - **Description**: 教育管理平台
   - **Visibility**: 选择 `Private`（推荐）或 `Public`
   - **不要** 勾选 "Add a README file"（本地已有）
4. 点击 **"Create repository"**

### 3.2 推送代码到 GitHub

在项目根目录执行以下命令：

```bash
# 初始化 Git 仓库（如果尚未初始化）
git init

# 添加远程仓库
git remote add origin https://github.com/YOUR_USERNAME/edu-management-platform.git

# 确保 .gitignore 已配置
# 以下内容应已存在于 .gitignore 中：
# node_modules/
# dist/
# .env
# *.log

# 添加所有文件
git add .

# 提交
git commit -m "feat: 初始化教育管理平台，准备部署"

# 推送到 GitHub
git push -u origin main
```

---

## 4. Render 后端部署

### 4.1 使用 Blueprint 部署（推荐）

1. 登录 [Render Dashboard](https://dashboard.render.com/)
2. 点击 **"New"** > **"Blueprint"**
3. 连接你的 GitHub 仓库 `edu-management-platform`
4. Render 会自动检测项目根目录的 `render.yaml` 文件
5. 点击 **"Apply"** 确认 Blueprint 配置

### 4.2 配置环境变量

Blueprint 创建服务后，需要手动配置 `DATABASE_URL`：

1. 在 Render Dashboard 中，点击刚创建的 `edu-management-backend` 服务
2. 进入 **"Environment"** 选项卡
3. 添加/编辑以下环境变量：

| Key | Value | 说明 |
|-----|-------|------|
| `DATABASE_URL` | `postgresql://postgres.xxx:password@host:6532/postgres` | Supabase 连接字符串 |
| `JWT_SECRET` | *(已自动生成)* | JWT 签名密钥 |
| `NODE_ENV` | `production` | 运行环境 |
| `PORT` | `3000` | 服务端口 |
| `CORS_ORIGIN` | `*` | 允许的跨域来源 |

> **注意**: `JWT_SECRET` 会在 Blueprint 部署时自动生成，无需手动设置。

### 4.3 手动部署（备选方案）

如果不使用 Blueprint，可以手动创建 Web Service：

1. 在 Render Dashboard 中点击 **"New"** > **"Web Service"**
2. 连接 GitHub 仓库
3. 配置如下：

| 配置项 | 值 |
|--------|-----|
| **Name** | `edu-management-backend` |
| **Region** | Singapore |
| **Runtime** | Node |
| **Build Command** | `cd backend && npm install && npx prisma generate && npx prisma db push && npm run build` |
| **Start Command** | `cd backend && node dist/main.js` |
| **Plan** | Free |

4. 添加上述环境变量
5. 点击 **"Create Web Service"**

### 4.4 等待部署完成

- Render 会自动执行构建和部署
- 首次部署可能需要 5-10 分钟
- 部署成功后，会分配一个 URL，如：`https://edu-management-backend.onrender.com`
- Prisma 的 `db push` 命令会在构建阶段自动创建数据库表结构
- 种子数据可通过手动触发或首次部署后运行 `npx prisma db seed` 来初始化

---

## 5. Netlify 前端部署

### 5.1 方式一：通过 Netlify UI 部署

1. 登录 [Netlify Dashboard](https://app.netlify.com/)
2. 点击 **"Add new site"** > **"Import an existing project"**
3. 选择 **GitHub** 并授权访问
4. 选择仓库 `edu-management-platform`
5. 配置构建设置：

| 配置项 | 值 |
|--------|-----|
| **Base directory** | `frontend` |
| **Build command** | `npm run build` |
| **Publish directory** | `frontend/dist` |

6. 添加环境变量：

| Key | Value |
|-----|-------|
| `VITE_API_BASE_URL` | `https://edu-management-backend.onrender.com/api/v1` |

> **重要**: 将 `VITE_API_BASE_URL` 的值替换为你的 Render 后端实际 URL。

7. 点击 **"Deploy site"**

### 5.2 方式二：使用 Netlify CLI 部署

```bash
# 安装 Netlify CLI
npm install -g netlify-cli

# 登录
netlify login

# 在 frontend 目录下初始化
cd frontend
netlify init

# 部署
netlify deploy --prod
```

### 5.3 配置自定义域名（可选）

1. 在 Netlify Dashboard 中，进入站点设置
2. 点击 **"Domain settings"** > **"Add custom domain"**
3. 输入你的域名并按提示配置 DNS

---

## 6. 部署后验证

### 6.1 验证后端 API

```bash
# 检查后端健康状态
curl https://edu-management-backend.onrender.com/api/v1/health

# 查看 Swagger API 文档
# 在浏览器打开: https://edu-management-backend.onrender.com/docs
```

### 6.2 验证前端

1. 在浏览器打开 Netlify 分配的 URL（如 `https://your-site-name.netlify.app`）
2. 应该能看到登录页面
3. 使用默认管理员账号登录：
   - 用户名: `admin`
   - 密码: `admin123`

### 6.3 验证数据库连接

1. 登录 Supabase Dashboard
2. 进入 **Table Editor**
3. 确认以下表已创建：
   - `institutions` - 机构表
   - `users` - 用户表
   - `roles` - 角色表
   - `permissions` - 权限表
   - 等等

### 6.4 默认测试账号

部署完成后，如果已运行种子数据，可以使用以下账号测试：

| 用户名 | 密码 | 角色 |
|--------|------|------|
| `admin` | `admin123` | 管理员 |
| `teacher` | `teacher123` | 教师 |
| `student` | `student123` | 学生 |
| `parent` | `parent123` | 家长 |

---

## 7. 常见问题排查

### Q1: Render 部署失败，提示数据库连接错误

**解决方案**:
- 检查 `DATABASE_URL` 是否正确配置
- 确保 Supabase 数据库密码中没有特殊字符（如有，需要 URL 编码）
- 尝试将连接字符串中的端口从 `6532` 改为 `5432`

### Q2: 前端页面显示 "Network Error"

**解决方案**:
- 检查 `VITE_API_BASE_URL` 是否指向正确的 Render 后端 URL
- 确保 Render 后端服务正在运行（状态为 "Live"）
- 检查浏览器控制台的 CORS 错误

### Q3: Render Free Plan 服务休眠

**说明**: Render 的 Free Plan 会在 15 分钟无请求后自动休眠，首次请求可能需要 30-60 秒唤醒。

**解决方案**:
- 考虑升级到付费计划
- 或使用外部 cron 服务（如 [cron-job.org](https://cron-job.org)）定期发送请求保持活跃

### Q4: Prisma 数据库迁移问题

**解决方案**:
```bash
# 本地生成迁移文件
cd backend
npx prisma migrate dev --name init

# 将迁移文件推送到 Git
git add prisma/migrations
git commit -m "feat: 添加 Prisma 迁移文件"
git push

# Render 会在重新部署时自动执行迁移
```

### Q5: 种子数据未初始化

**解决方案**:
部署后可以通过以下方式初始化种子数据：

1. **通过 Render Shell**: 在 Render Dashboard 中进入服务，点击 "Shell" 标签，运行：
   ```bash
   cd backend && npx prisma db seed
   ```

2. **通过临时修改启动命令**: 将 Render 的 Start Command 临时改为：
   ```
   cd backend && npx prisma db seed && node dist/main.js
   ```
   部署完成后记得改回来。

---

## 架构总览

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│    Netlify      │────>│     Render      │────>│   Supabase      │
│   (Frontend)    │ API │   (Backend)     │ SQL │  (PostgreSQL)   │
│                 │     │                 │     │                 │
│  React + Vite   │     │  NestJS + Prisma│     │   PostgreSQL    │
│  + Ant Design   │     │  + Socket.IO    │     │                 │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
   *.netlify.app         *.onrender.com          *.supabase.com
```

---

## 文件清单

以下是与部署相关的文件：

| 文件 | 说明 |
|------|------|
| `render.yaml` | Render Blueprint 配置文件 |
| `backend/Dockerfile` | 后端 Docker 构建文件 |
| `backend/.dockerignore` | Docker 构建忽略文件 |
| `backend/tsconfig.build.json` | TypeScript 构建配置 |
| `backend/.env.example` | 环境变量示例文件 |
| `backend/prisma/seed.ts` | 数据库种子数据脚本 |
| `frontend/netlify.toml` | Netlify 构建配置文件 |
| `frontend/.env.production` | 前端生产环境变量 |
