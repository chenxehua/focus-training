# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

儿童专注力训练微信小程序「专注星球」（FocusKids），面向 4-12 岁儿童，包含 9 款专注力训练游戏，提供家长数据报告与成就系统。

产品 Slogan：**每天10分钟，专注伴成长**

## 技术栈

| 层次 | 技术 |
|------|------|
| 前端 | uni-app (Vue3 + TypeScript + Pinia)，目标平台：微信小程序 |
| 后端 | Node.js + Express + TypeScript |
| 数据库 | MySQL 8.0 + Redis |
| Monorepo | npm workspaces |

## 开发命令

```bash
# 安装所有依赖
npm install

# 启动后端（热重载）
npm run dev:server

# 启动小程序开发构建
npm run dev:miniapp

# 生产构建
npm run build:server
npm run build:miniapp
```

微信开发者工具导入 `packages/miniapp/dist/dev/mp-weixin` 即可预览。

## 目录结构

```
focus-training/
├── package.json          # workspace root，定义 scripts 和 workspaces
├── packages/
│   ├── miniapp/          # uni-app 微信小程序前端
│   │   ├── src/
│   │   │   ├── api/          # 请求封装（request.ts + 各模块 API）
│   │   │   ├── components/   # 通用组件（GameCard, GameTimer, ProgressBar, StarRating）
│   │   │   ├── pages/        # 页面（index, games, game-schulte, parent, profile）
│   │   │   ├── store/        # Pinia 状态（user, game, index）
│   │   │   └── utils/        # 工具函数（auth.ts, storage.ts）
│   │   └── package.json
│   └── server/           # Express 后端
│       ├── src/
│       │   ├── app.ts          # Express 应用入口
│       │   ├── server.ts       # HTTP 服务器
│       │   ├── config/         # 数据库和 Redis 配置
│       │   ├── controllers/    # 业务逻辑（auth, user, game, report）
│       │   ├── middleware/     # 中间件（auth, errorHandler, rateLimit）
│       │   ├── models/         # 数据模型（User, Child, TrainingRecord, FocusReport）
│       │   ├── routes/         # 路由定义
│       │   └── types/          # TypeScript 类型定义
│       ├── sql/init.sql        # 数据库初始化脚本
│       └── package.json
└── docs/                 # 产品设计文档（PRD、数据库设计、UI 设计等）
```

## 后端架构

Express + TypeScript，使用 mysql2 连接池（不使用 ORM）。

**认证方案**：JWT（有效期 7 天）+ Redis 缓存用户 session。

**接口规范**：所有接口前缀 `/api`，认证接口在 Header 中携带 `Authorization: Bearer <token>`。

## API 路由

| 模块 | 路径 | 说明 |
|------|------|------|
| auth | POST /api/auth/wx-login | 微信登录 |
| user | GET /api/user/info | 获取用户信息 |
| user | POST /api/user/child | 添加儿童 |
| user | GET /api/user/children | 获取儿童列表 |
| game | POST /api/game/record | 提交游戏记录 |
| game | GET /api/game/records | 获取训练历史 |
| report | GET /api/report/weekly/:childId | 获取周报 |
| report | GET /api/report/today/:childId | 获取今日数据 |

## 数据库

MySQL 8.0 + Redis。初始化：`mysql -u root -p < packages/server/sql/init.sql`

**核心表**：user（家长）、child（儿童）、training_record（训练记录）、game（游戏配置）、achievement（成就）、focus_report（报告）

## 品牌色彩

| 用途 | 色值 |
|------|------|
| 主色（品牌紫） | `#6C63FF` |
| 成功色（草地绿） | `#6BCB77` |
| 警告色（阳光黄） | `#FFD93D` |
| 错误色（柔和红） | `#FF8A80` |
| 文字主色 | `#333333` |
| 文字次色 | `#666666` |

## 游戏列表

| 编号 | 游戏名称 | 类型 |
|------|----------|------|
| G001 | 舒尔特方格 | 注意力 |
| G002 | 数字连连看 | 注意力 |
| G003 | 颜色识别 | 感知 |
| G004 | 图形记忆 | 记忆 |
| G005 | 反应速度 | 反应 |
| G006 | 专注呼吸 | 冥想 |
| G007 | 找不同 | 观察 |
| G008 | 数字方阵 | 计算 |
| G009 | 声音专注 | 听觉 |

## 环境配置

```bash
cp packages/server/.env.example packages/server/.env
```

## 注意事项

1. TypeScript 严格模式，所有文件必须通过类型检查
2. Vue 组件使用 `<script setup lang="ts">` 写法
3. 后端使用 mysql2 连接池，不使用 ORM
4. 小程序请求封装见 `packages/miniapp/src/api/request.ts`