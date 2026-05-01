# Apple Store 销售管理系统

> 苹果零售店销售数据管理平台，支持员工管理、订单录入、培训跟进、周度计划与数据可视化。

---

## 📋 目录

- [项目介绍](#项目介绍)
- [桌面版下载（推荐）](#桌面版下载推荐)
- [功能概览](#功能概览)
- [网页版部署](#网页版部署)
- [本地开发](#本地开发)
- [使用指南](#使用指南)
- [常见问题](#常见问题)

---

## 项目介绍

本项目是一款面向苹果零售店销售团队的管理工具，帮助店长/销售主管：

- 📊 实时查看销售数据（iPhone 销量、以旧换新率、分期率等）
- 👥 管理销售员工信息
- 📝 录入和导入销售订单（支持 Excel 批量导入）
- 🎓 跟进每周培训任务完成情况
- 🎯 制定周度销售目标并追踪完成进度

数据存储在 **Supabase（云端 PostgreSQL 数据库）**，支持多设备实时同步。

---

## 桌面版下载（推荐）

> 💻 无需浏览器，直接双击运行，数据与网页版完全同步！

下载桌面版（Windows 绿色版，无需安装）：

- **[📦 v1.2（推荐）](https://github.com/mashinoray/apple-store-sales/releases/tag/v1.2)** - 修复空白页面，窗口化启动（1500×950）
- **[📦 所有版本](https://github.com/mashinoray/apple-store-sales/releases)** - 查看历史版本

### v1.2 更新内容

- ✅ 修复启动后空白页面的问题
- ✅ 调整为窗口化启动（1500×950），不再默认全屏
- ✅ 内容完整显示，无需手动调整窗口大小

### 使用方法

1. 从 Releases 页面下载 `apple-sales-app-v1.2.zip`
2. 解压后双击 **`Apple Store 销售系统.exe`** 即可运行
3. 无需安装，解压后可移动到任意位置使用

### 桌面版特点

- ✅ 无需浏览器，直接运行
- ✅ 数据自动同步 Supabase 云端
- ✅ 禁止多开（防止数据冲突）
- ✅ 支持最小化、最大化、关闭等标准窗口操作
- ✅ 数据与网页版完全互通

---

## 功能概览

| 页面 | 功能说明 |
|------|---------|
| 📊 数据看板 | 按日期范围查看销售统计、员工排名、未成交原因分析图表 |
| 📝 订单管理 | 录入/编辑/删除订单，标记以旧换新状态 |
| 📤 导入数据 | 上传零售系统导出的 Excel，自动解析并导入订单 |
| 👥 员工管理 | 添加/编辑/删除员工，设置职位和在职状态 |
| 🎓 培训跟进 | 按周查看员工培训任务完成情况，点击勾选标记 |
| 📅 周度 Apple 项目看板 | 对比本周与上周 iPhone 换新率、主机销量等数据 |
| 📊 周度销售项目看板 | 查看套包数量、ACS 连带率、保险数量等销售项目指标 |
| 🎯 周度计划 | 设置每周销售目标（iPhone 销量、换新率、分期率等） |

---

## 从零开始部署

> 本教程适合**完全没有接触过该项目的用户**，跟着步骤操作即可完成部署。

---

### 第一步：准备环境

你需要先安装以下工具：

| 工具 | 最低版本 | 下载地址 |
|------|---------|---------|
| Node.js | 18.0.0+ | https://nodejs.org |
| Git | 任意新版 | https://git-scm.com |
| 代码编辑器（推荐） | - | https://code.visualstudio.com |

安装完成后，打开终端验证：

```bash
node -v    # 应显示 v18.x.x 或更高
npm -v     # 应显示 8.x.x 或更高
git -v     # 应显示 git 版本号
```

---

### 第二步：获取项目代码

**方式一：从 GitHub 克隆（推荐）**

```bash
git clone https://github.com/mashinoray/apple-store-sales.git
cd apple-store-sales
```

**方式二：下载 ZIP 包**

访问 https://github.com/mashinoray/apple-store-sales ，点击绿色 `Code` 按钮，选择 `Download ZIP`，解压后再用终端进入文件夹。

---

### 第三步：安装依赖

在项目文件夹中运行：

```bash
npm install
```

> ⏳ 首次安装需要 1~3 分钟，请耐心等待。

安装完成后，项目根目录会出现 `node_modules` 文件夹。

---

### 第四步：创建 Supabase 数据库

本项目的所有数据（员工、订单、培训记录、周度计划）都存储在 Supabase 云端数据库中。你需要创建自己的 Supabase 项目。

#### 4.1 注册并创建项目

1. 访问 https://supabase.com 并注册/登录
2. 点击 `New Project`
3. 填写：
   - **Name**：`apple-store-sales`（可自定义）
   - **Database Password**：设置一个强密码（请记住！）
   - **Region**：选择离你最近的地区，推荐 `Northeast Asia (Seoul)` 或 `Singapore`
4. 点击 `Create new project`，等待项目创建完成（约 1~2 分钟）

#### 4.2 获取数据库连接信息

项目创建完成后：

1. 进入 Supabase 控制台，点击左侧 `Settings`（设置）→ `API`
2. 找到以下两个值，**复制保存**：
   - **Project URL**（`https://xxxx.supabase.co`）
   - **anon public** key（以 `eyJ` 开头的长字符串）

#### 4.3 创建数据表

1. 在 Supabase 控制台，点击左侧 `SQL Editor`
2. 点击 `New query`，粘贴以下 SQL，然后点击 `Run`：

```sql
-- 员工表
CREATE TABLE IF NOT EXISTS public.employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  position TEXT DEFAULT '销售顾问',
  avatar TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 订单表
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  customer_name TEXT,
  customer_type TEXT DEFAULT 'new',
  product TEXT NOT NULL,
  purchase_type TEXT DEFAULT 'full',
  installment_months INTEGER,
  has_trade_in BOOLEAN DEFAULT false,
  trade_in_reason TEXT,
  custom_reason TEXT,
  amount REAL,
  date TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- 销售项目字段（套包/ACS/保险）
  bundle_type TEXT,
  has_acs BOOLEAN DEFAULT false,
  has_ruiyi BOOLEAN DEFAULT false
);

-- 为已有订单表添加销售项目字段（如表已存在则执行以下ALTER语句）
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS bundle_type TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS has_acs BOOLEAN DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS has_ruiyi BOOLEAN DEFAULT false;

-- 周培训记录表
CREATE TABLE IF NOT EXISTS public.weekly_training (
  id TEXT PRIMARY KEY,
  week_start_date TEXT NOT NULL,
  year INTEGER NOT NULL,
  week_number INTEGER NOT NULL,
  tasks JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 周度计划表
CREATE TABLE IF NOT EXISTS public.weekly_plans (
  id TEXT PRIMARY KEY,
  week_start_date TEXT NOT NULL,
  year INTEGER NOT NULL,
  week_number INTEGER NOT NULL,
  targets JSONB NOT NULL,
  employee_targets JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 禁用行级安全（方便使用，生产环境可后续配置）
ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_training DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_plans DISABLE ROW LEVEL SECURITY;
```

✅ 看到 `Success. No rows returned` 说明表创建成功！

---

### 第五步：配置数据库连接

用代码编辑器打开项目，找到并编辑 `src/lib/supabase.ts` 文件：

```typescript
// 将这两行改为你自己的 Supabase 信息
const supabaseUrl = 'https://xxxxxxxxxxxxx.supabase.co';  // ← 替换为你的 Project URL
const supabaseAnonKey = 'eyJhbGc...';                    // ← 替换为你的 anon key
```

保存文件。

---

### 第六步：本地测试（可选但推荐）

在部署前，先本地运行确认一切正常：

```bash
npm run dev
```

浏览器打开 `http://localhost:5173`，应该能看到系统界面。

---

### 第七步：推送到 GitHub

部署到 Cloudflare Pages 需要从 GitHub 拉取代码。

1. 在 GitHub 上创建新仓库（名称如 `apple-store-sales`）
2. 将代码推送上去：

```bash
git init                  # 如果是第一次克隆则跳过
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/你的用户名/仓库名.git
git push -u origin main
```

---

### 第八步：部署到 Cloudflare Pages

> ☁️ 为什么选 Cloudflare Pages？因为它在**中国大陆可以正常访问**，而 Vercel 在国内经常打不开。

#### 8.1 注册 Cloudflare

1. 访问 https://pages.cloudflare.com 并注册/登录
2. 点击 `Create a project` → `Connect to Git`

#### 8.2 授权并选择仓库

1. 授权 Cloudflare 访问你的 GitHub 账号
2. 选择刚才推送的 `apple-store-sales` 仓库

#### 8.3 配置构建设置

在配置页面填写以下信息：

| 配置项 | 填写内容 |
|--------|---------|
| Project name | `apple-store-sales`（可自定义）|
| Production branch | `main`（或 `master`）|
| Framework preset | `Vite` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Environment variables | 见下方 |

**环境变量（Environment variables）**：

添加以下变量（可选，主要用于 CI 稳定性）：

| 变量名 | 值 |
|--------|-----|
| `NODE_VERSION` | `18` |

#### 8.4 点击 `Save and Deploy`

首次部署约需 1~3 分钟。部署完成后，Cloudflare 会提供一个 `.pages.dev` 结尾的访问地址。

✅ **部署成功！** 用浏览器打开这个地址就能使用系统了。

---

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器（热更新）
npm run dev

# 构建生产版本（用于测试构建是否成功）
npm run build

# 预览生产构建结果
npm run preview
```

---

## 使用指南

### 👥 员工管理

1. 点击左侧导航 **「员工管理」**
2. 点击 **「添加员工」** 填写：
   - 姓名（必填）
   - 工号（必填，唯一标识）
   - 职位（销售顾问/店长/副店长）
3. 点击 **「保存」**

> 💡 只有「在职状态」为开启的员工才会出现在订单录入的选择列表中。

---

### 📝 录入订单

1. 在任意页面，点击右上角 **「录入订单」** 按钮
2. 填写订单信息：
   - **员工**：选择销售员
   - **产品**：iPhone / iPad / Mac / Apple Watch 等
   - **购买方式**：全款 / 分期（可选 12/24/36 期）
   - **以旧换新**：选择「是」或「否」
3. 如果选择「否」，系统会要求选择**未成交原因**
4. 点击 **「提交订单」**

---

### 📤 批量导入订单（Excel）

如果你的零售系统可以导出 Excel 销售报表，可以直接导入：

1. 点击左侧导航 **「导入数据」**
2. 点击 **「上传 Excel 文件」**，选择从系统导出的零售职员销售统计表
3. 系统会自动识别并解析数据，显示预览
4. 确认无误后，点击 **「同步到订单管理」**
5. 系统会自动创建新员工的记录，并将订单导入

> ⚠️ 支持的文件格式：`.xlsx` / `.xls`，系统会自动识别表头行。

---

### 📊 查看数据看板

1. 点击左侧导航 **「数据看板」**
2. 使用右上角的**日期选择器**设置查看范围
3. 看板会显示：
   - 📱 iPhone 销量 / 其他主机销量 / 主机总销量
   - 🔄 以旧换新率 / iPhone 换新率
   - 💳 分期付款率
   - 📈 员工销量排名表格
   - 🍰 未成交原因分布图

---

### 🎓 培训跟进

1. 点击左侧导航 **「培训跟进」**
2. 使用右上角周次选择器切换查看的周次
3. 在表格中找到对应员工和培训任务，点击复选框标记完成状态
4. 数据会自动保存到云端

> 📋 培训任务类型包括：种子用户活跃、知鸟学习、直播间观看、考试完成、小程序使用、达达乐等。

---

### 🎯 周度计划

1. 点击左侧导航 **「周度计划」**
2. 选择要制定计划的周次
3. 设置整体目标（iPhone 基线、换新率目标、分期目标等）
4. 为每位员工设置个人目标
5. 点击 **「保存计划」**

---

## 常见问题

### ❓ 页面打不开 / 部署失败

- **Cloudflare 构建失败**：检查 `package.json` 中 Vite 版本是否为 `^5.0.0`（本模板已配置兼容）。如仍有问题，确认 `node_modules` 未提交到 Git。
- **国内访问问题**：确保使用的是 Cloudflare Pages 而非 Vercel（Vercel 在国内经常无法访问）。

### ❓ 数据没有同步 / 显示云端同步失败

- 检查 `src/lib/supabase.ts` 中的 Supabase URL 和 Key 是否正确
- 确认 Supabase 项目的数据库表已正确创建
- 在 Supabase 控制台 → `Table Editor` 中查看是否有数据

### ❓ 如何修改系统的名称或 Logo？

- 修改 `src/App.tsx` 第 353 行的 `<Apple size={28} />` 和 `Apple项目管理中心` 文字
- 或修改 `public/index.html` 中的 `<title>` 标签

### ❓ 我想在本地新增功能，如何开始？

1. 确保已安装依赖：`npm install`
2. 启动开发模式：`npm run dev`
3. 代码修改后会自动热更新，直接在浏览器中看到效果
4. 功能开发完成后，提交并推送至 GitHub，Cloudflare 会自动重新部署

---

## 技术栈

| 技术 | 说明 |
|------|------|
| React 18 | 前端框架 |
| TypeScript | 类型安全 |
| Vite 5 | 构建工具 |
| Tailwind CSS | 样式框架 |
| Supabase | 后端数据库（PostgreSQL + 实时同步）|
| Recharts | 数据可视化图表 |
| Radix UI | 无障碍 UI 组件 |
| Cloudflare Pages | 部署平台 |

---

## License

MIT License — 可自由使用、修改和分发。

---

> 📧 问题反馈：请在 GitHub Issues 中提交，或联系开发者 Ray ☕
