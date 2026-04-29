# Apple Store Sales Management System

苹果零售店销售管理系统 - 员工订单管理与数据可视化平台

## 功能概览

### 1. 仪表盘
- 销售数据总览
- 实时数据同步
- 可视化图表展示

### 2. 订单管理
- 添加/编辑/删除销售订单
- 支持全款和分期付款
- 以旧换新记录
- 批量导入订单

### 3. 员工管理
- 员工信息管理
- 工号、职位管理
- 在职状态跟踪

### 4. 培训管理
- 周培训任务跟踪
- 多种培训类型支持（种子用户、直播、答题等）

### 5. 周度计划
- 设置销售目标
- 追踪iPhone、以旧换新、分期等指标
- 员工目标分配

## 技术栈

| 技术 | 说明 |
|------|------|
| React 18 | 前端框架 |
| TypeScript | 类型安全 |
| Vite 5 | 构建工具 |
| Tailwind CSS | 样式框架 |
| Supabase | 后端数据库（实时同步） |
| Recharts | 数据可视化 |
| Radix UI | UI组件库 |
| Vercel | 部署平台 |

## 快速开始

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 环境要求

- Node.js >= 18.0.0
- npm >= 8.0.0

## 部署

### Vercel（推荐）

项目已配置Vercel部署，推送到GitHub后自动部署。

**生产环境地址**: https://apple-store-sales.vercel.app

### 手动部署

```bash
# 构建项目
npm run build

# 部署 dist 目录
```

## 数据库配置

本项目使用Supabase作为后端数据库。

### Supabase项目配置

项目已配置以下Supabase凭据：
- **URL**: https://lplrrwhiibaihooqtagz.supabase.co
- **Anon Key**: sb_publishable_l7PQ4l1tHbvlEdrAi5UGVQ_R1RphqTE

### 数据库表结构

1. **employees** - 员工表
2. **orders** - 订单表
3. **weekly_training** - 周培训记录表
4. **weekly_plans** - 周度计划表

## 数据说明

- 所有数据存储在云端Supabase数据库
- 支持实时数据同步
- 数据跨设备同步

## 开发团队

- 开发：Ray
- 技术支持：Chino AI Assistant

## License

MIT License
