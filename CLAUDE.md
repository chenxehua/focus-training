# 儿童专注力训练小程序 — Monorepo

## 项目概述

一款面向 4-12 岁儿童的专注力训练微信小程序，包含 9 款专注力训练游戏，提供家长数据报告与成就系统。

## 技术栈

| 层次 | 技术 |
|------|------|
| 前端 | uni-app (Vue3 + TypeScript + Pinia)，目标平台：微信小程序 |
| 后端 | Node.js + Express + TypeScript |
| 数据库 | MySQL 8.0 + Redis |
| Monorepo | npm workspaces |

## 目录结构

```
expo-express-monorepo/
├── package.json          # workspace root
├── packages/
│   ├── miniapp/          # uni-app 微信小程序前端
│   └── server/           # Express 后端
└── doc/                  # 产品设计文档
```

## 开发命令

```bash
# 安装所有依赖
npm install

# 启动后端开发服务器（热重载）
npm run dev:server

# 启动小程序开发构建（微信开发者工具打开 packages/miniapp/dist/dev/mp-weixin）
npm run dev:miniapp

# 生产构建
npm run build:server
npm run build:miniapp
```

## 后端单独命令

```bash
cd packages/server

# 开发模式
npm run dev

# 构建
npm run build

# 生产启动
npm start

# 数据库初始化
mysql -u root -p < sql/init.sql
```

## 小程序单独命令

```bash
cd packages/miniapp

# 微信小程序开发构建
npm run dev:mp-weixin

# 微信小程序生产构建
npm run build:mp-weixin
```

## 环境变量配置

复制 `packages/server/.env.example` 为 `packages/server/.env`，填写实际配置：

```bash
cp packages/server/.env.example packages/server/.env
```

## 数据库初始化

```bash
# 创建数据库并初始化表结构与游戏数据
mysql -u root -p < packages/server/sql/init.sql
```

## 品牌色彩

- 主色（品牌紫）：`#6C63FF`
- 成功色（草地绿）：`#6BCB77`
- 警告色（阳光黄）：`#FFD93D`
- 错误色（柔和红）：`#FF8A80`
- 文字主色：`#333333`
- 文字次色：`#666666`

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

## API 规范

所有接口前缀 `/api`，认证接口在 Header 中携带 `Authorization: Bearer <token>`。

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/wx-login | 微信登录 |
| GET | /api/user/info | 获取用户信息 |
| POST | /api/user/child | 添加儿童 |
| GET | /api/user/children | 获取儿童列表 |
| POST | /api/game/record | 提交游戏记录 |
| GET | /api/game/records | 获取训练历史 |
| GET | /api/report/weekly/:childId | 获取周报 |
| GET | /api/report/today/:childId | 获取今日数据 |

## 注意事项

1. TypeScript 严格模式，所有文件必须通过类型检查
2. Vue 组件使用 `<script setup lang="ts">` 写法
3. 后端使用 mysql2 连接池，不使用 ORM
4. JWT 有效期 7 天，Redis 缓存用户 session
5. 小程序请求封装见 `packages/miniapp/src/api/request.ts`
