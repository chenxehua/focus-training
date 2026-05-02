# Phase 6 开发任务分解（第19-26周）

> 游戏07-09开发阶段

---

## T6.1 游戏07 - 迷宫寻路（小熊找蜂蜜）

### 前端开发任务

#### T6.1.1 迷宫主题界面
- 创建 `pages/game-maze/index.vue`
- 小熊/宇航员主题选择
- 迷宫展示区域
- 状态栏设计

#### T6.1.2 角色控制开发
- 方向键/滑动手势
- 点击相邻格子移动
- 移动动画（100-150ms）

#### T6.1.3 碰撞检测系统
- 网格化迷宫存储
- 墙壁检测
- 路径验证
- 碰撞抖动反馈

#### T6.1.4 计时与提示系统
- 毫秒级计时器
- 暂停/继续功能
- 提示按钮（高亮方向）
- 超时判定

#### T6.1.5 5级难度配置
```javascript
const difficultyConfig = {
  1: { size: 5, walls: 5, timeLimit: 60, hints: 3, theme: 'bear' },
  2: { size: 6, walls: 8, timeLimit: 50, hints: 2, theme: 'bear' },
  3: { size: 7, walls: 12, timeLimit: 45, hints: 2, theme: 'bear' },
  4: { size: 9, walls: 18, timeLimit: 40, hints: 1, theme: 'astronaut' },
  5: { size: 11, walls: 25, timeLimit: 30, hints: 0, theme: 'astronaut' }
}
```

### 后端开发任务

#### T6.1.6 迷宫生成算法
- 递归回溯算法
- Prim 算法备选
- 关卡预设库
- 难度渐进式生成

#### T6.1.7 A*寻路算法
- 最优路径计算
- 效率评估
- 死胡同检测

#### T6.1.8 路径记录系统
- 移动轨迹记录
- 步数统计
- 碰撞次数记录

#### T6.1.9 评分算法实现
- 效率比 = 最优步数 / 实际步数
- 完成时间
- 碰撞次数
- S/A/B/C/D 评级

**工时小计**：约 152 人时

---

## T6.2 游戏08 - 快速分类（物品整理小能手）

### 前端开发任务

#### T6.2.1 物品分类界面
- 创建 `pages/game-sort/index.vue`
- 规则显示区
- 物品展示区
- 分类按钮区

#### T6.2.2 物品掉落系统
- 物品随机生成
- 下落动画
- 位置布局算法

#### T6.2.3 拖拽/点击交互
- 分类操作响应
- 正确/错误反馈动画
- 连击特效

#### T6.2.4 规则切换系统
- 规则动态切换
- 切换提示动画
- 适应期处理

#### T6.2.5 连击奖励系统
- 连击计数
- 连击分数加成
- 连击特效展示

#### T6.2.6 5级难度配置
```javascript
const difficultyConfig = {
  1: { questionCount: 10, categories: 2, switchInterval: 0, timeLimit: 10, type: 'color' },
  2: { questionCount: 15, categories: 2, switchInterval: 8, timeLimit: 8, type: 'category' },
  3: { questionCount: 18, categories: 3, switchInterval: 6, timeLimit: 5, type: 'mixed' },
  4: { questionCount: 22, categories: 3, switchInterval: 4, timeLimit: 4, type: 'mixed' },
  5: { questionCount: 25, categories: 4, switchInterval: 3, timeLimit: 3, type: 'complex' }
}
```

### 后端开发任务

#### T6.2.7 物品数据库设计
- 物品分类规则库
- 随机出题算法
- 干扰项配置

#### T6.2.8 分类记录API
- 分类操作记录
- 正确率统计
- 切换后准确率分析

**工时小计**：约 136 人时

---

## T6.3 游戏09 - 追踪目标（追踪小星星）

### 前端开发任务

#### T6.3.1 星空主题界面
- 创建 `pages/game-tracking/index.vue`
- 深蓝渐变星空背景
- 星星绘制系统

#### T6.3.2 星星移动系统
- 贝塞尔曲线移动
- 平滑动画
- 移动速度控制

#### T6.3.3 目标选择系统
- 目标高亮指示
- 闪烁提示
- 选择确认动画

#### T6.3.4 干扰事件系统
- 闪烁效果
- 变色效果
- 消失效果
- 分身效果

#### T6.3.5 追踪状态管理
- 追踪时间统计
- 准确率计算
- 变化报告按钮

#### T6.3.6 5级难度配置
```javascript
const difficultyConfig = {
  1: { starCount: 3, targetCount: 1, speed: 'slow', interference: [], duration: 30 },
  2: { starCount: 5, targetCount: 1, speed: 'medium', interference: ['flicker'], duration: 35 },
  3: { starCount: 7, targetCount: 2, speed: 'medium', interference: ['flicker', 'color'], duration: 40 },
  4: { starCount: 10, targetCount: 2, speed: 'fast', interference: ['flicker', 'color', 'disappear'], duration: 45 },
  5: { starCount: 12, targetCount: 3, speed: 'fast', interference: ['flicker', 'color', 'disappear', 'clone'], duration: 50 }
}
```

### 后端开发任务

#### T6.3.7 轨迹记录API
- 星星轨迹记录
- 变化检测记录
- 追踪准确率计算

**工时小计**：约 128 人时

---

## 阶段六模块清单

| 模块编号 | 模块名称 | 工时 | 优先级 | 状态 |
|----------|----------|------|--------|------|
| T6.1 | 迷宫寻路 | 152h | P0 | 待开发 |
| T6.2 | 快速分类 | 136h | P0 | 待开发 |
| T6.3 | 追踪目标 | 128h | P0 | 待开发 |

**阶段六总工时**：约 416 人时

---

## 里程碑：M9 游戏7-9完成

| 里程碑 | 计划时间 | 完成标准 |
|--------|----------|----------|
| M9.1 | 第20周 | 迷宫寻路游戏可玩 |
| M9.2 | 第22周 | 快速分类游戏可玩 |
| M9.3 | 第24周 | 追踪目标游戏可玩 |
| M9.4 | 第26周 | 三个游戏测试通过 |

---

## 验收标准

| 游戏 | 验收标准 |
|------|----------|
| 迷宫寻路 | 迷宫生成正常，移动流畅，碰撞检测准确，评分正确 |
| 快速分类 | 物品显示正常，分类响应及时，规则切换正常，连击系统正常 |
| 追踪目标 | 星星移动平滑，干扰效果正常，追踪状态管理准确 |