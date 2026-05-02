# Phase 5 开发任务分解（第13-18周）

> 游戏04-06开发阶段

---

## T5.1 游戏04 - 视觉追踪

### 前端开发任务

#### T5.1.1 游戏界面开发
- 创建 `pages/game-visual/index.vue` 页面结构
- 实现星星追踪主题UI布局
- 状态栏显示（追踪进度、时间、目标数）
- 响应式适配

#### T5.1.2 目标移动系统
- 实现星星对象数据结构
- 随机方向移动算法
- 边界反弹逻辑
- 移动速度分级控制

#### T5.1.3 触摸追踪逻辑
- 目标高亮/取消高亮
- 追踪状态管理
- 追踪轨迹记录

#### T5.1.4 干扰系统开发
- 闪烁效果（随机星星闪烁）
- 变色效果（目标短暂失去标记）
- 假消失效果（目标短暂隐藏）
- 干扰事件定时触发

#### T5.1.5 问答界面开发
- 变化次数报告按钮
- 报告确认弹窗
- 结果判定展示

#### T5.1.6 5级难度配置
```javascript
const difficultyConfig = {
  1: { starCount: 3, targetCount: 1, speed: 'slow', interference: [], duration: 30 },
  2: { starCount: 4, targetCount: 1, speed: 'medium', interference: ['flicker'], duration: 35 },
  3: { starCount: 5, targetCount: 1, speed: 'medium', interference: ['flicker', 'color'], duration: 40 },
  4: { starCount: 6, targetCount: 2, speed: 'fast', interference: ['flicker', 'color', 'disappear'], duration: 45 },
  5: { starCount: 8, targetCount: 2, speed: 'fast', interference: ['flicker', 'color', 'disappear', 'clone'], duration: 50 }
}
```

### 后端开发任务

#### T5.1.7 轨迹记录系统
- 记录追踪轨迹数据
- 计算追踪准确率
- 抗干扰能力分析

#### T5.1.8 评分算法实现
- 追踪准确率 = 正确追踪时间 / 总时间
- 变化检测率 = 正确检测次数 / 总变化次数
- 综合得分计算

**工时小计**：约 128 人时

---

## T5.2 游戏05 - 节奏点击

### 前端开发任务

#### T5.2.1 节拍器界面
- 创建 `pages/game-rhythm/index.vue`
- 节奏可视化界面设计
- 圆形节拍区域
- 状态显示栏

#### T5.2.2 点击检测系统
- 精确点击时间捕获（requestAnimationFrame）
- 点击判定逻辑
- Perfect/Good/OK/Miss 判定

#### T5.2.3 评分判定逻辑
- 完美窗口：±50ms
- 良好窗口：±100ms
- 尚可窗口：±150ms
- 失误：>150ms

#### T5.2.4 动画反馈开发
- Perfect：金色光环 + 震动
- Good：蓝色光晕
- OK：绿色
- Miss：红色闪烁

#### T5.2.5 音效系统集成
- Web Audio API 集成
- 节拍音效播放
- 反馈音效（正确/错误）

#### T5.2.6 双击模式开发
- 左右双键位模式
- 同时节拍双键同时按下

#### T5.2.7 5级难度配置
```javascript
const difficultyConfig = {
  1: { bpm: 60, mode: 'single', duration: 20, pattern: 'simple' },
  2: { bpm: 80, mode: 'single', duration: 25, pattern: 'normal' },
  3: { bpm: 100, mode: 'single', duration: 30, pattern: 'complex' },
  4: { bpm: 120, mode: 'double', duration: 35, pattern: 'complex' },
  5: { bpm: 140, mode: 'double', duration: 40, pattern: 'extreme' }
}
```

### 后端开发任务

#### T5.2.8 节拍生成器
- BPM 控制
- 节拍序列生成
- 复杂节拍模式支持

**工时小计**：约 112 人时

---

## T5.3 游戏06 - 听觉记忆（小侦探听口令）

### 前端开发任务

#### T5.3.1 侦探主题界面
- 创建 `pages/game-audio/index.vue`
- 卡通侦探形象展示
- 主题背景设计
- 整体视觉风格

#### T5.3.2 语音播放系统
- Web Speech API 集成
- 数字语音合成播放
- 播放速度控制
- 播放进度可视化

#### T5.3.3 问答键盘开发
- 数字输入键盘 UI
- 输入状态管理
- 删除/确认按钮
- 输入动画反馈

#### T5.3.4 顺序/逆序模式
- 模式切换开关
- 答案验证逻辑
- 逆序模式提示

#### T5.3.5 动画反馈开发
- 正确：星星特效 + 鼓励语
- 错误：温柔提示 + 正确答案显示
- 完成：庆祝动画

#### T5.3.6 5级难度配置
```javascript
const difficultyConfig = {
  1: { sequenceLength: 3, playSpeed: 1000, mode: 'sequential', duration: 15 },
  2: { sequenceLength: 4, playSpeed: 1000, mode: 'sequential', duration: 20 },
  3: { sequenceLength: 5, playSpeed: 900, mode: 'sequential', duration: 25 },
  4: { sequenceLength: 6, playSpeed: 800, mode: 'sequential/reverse', duration: 30 },
  5: { sequenceLength: 7, playSpeed: 700, mode: 'sequential/reverse', duration: 35 }
}
```

### 后端开发任务

#### T5.3.7 数字序列生成
- 随机数生成算法
- 序列长度控制
- 音调配置

#### T5.3.8 训练记录API
- 序列数据保存
- 正确率统计
- 反应时间记录

**工时小计**：约 112 人时

---

## 阶段五模块清单

| 模块编号 | 模块名称 | 工时 | 优先级 | 状态 |
|----------|----------|------|--------|------|
| T5.1 | 视觉追踪 | 128h | P0 | 待开发 |
| T5.2 | 节奏点击 | 112h | P0 | 待开发 |
| T5.3 | 听觉记忆 | 112h | P0 | 待开发 |

**阶段五总工时**：约 352 人时

---

## 里程碑：M8 游戏4-6完成

| 里程碑 | 计划时间 | 完成标准 |
|--------|----------|----------|
| M8.1 | 第14周 | 视觉追踪游戏可玩 |
| M8.2 | 第15周 | 节奏点击游戏可玩 |
| M8.3 | 第16周 | 听觉记忆游戏可玩 |
| M8.4 | 第18周 | 三个游戏测试通过 |

---

## 验收标准

| 游戏 | 验收标准 |
|------|----------|
| 视觉追踪 | 星星移动流畅，干扰效果正常，追踪准确率计算正确 |
| 节奏点击 | 节拍同步精确，判定准确，动画反馈及时 |
| 听觉记忆 | 语音播放正常，输入响应及时，逆序模式正确 |