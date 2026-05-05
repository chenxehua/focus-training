# 专注星球 - 会员解锁系统设计文档

## 1. 游戏锁定机制

### 1.1 游戏类型标识

| 类型 | 数据库标识 | 说明 |
|------|-----------|------|
| 免费游戏 | `is_free=1` 或 `requires_vip=0` | 所有用户可玩 |
| 付费游戏 | `is_free=0` | 需购买会员 |
| VIP专属 | `requires_vip=1` | 需VIP会员等级 |

### 1.2 游戏列表

| 编号 | 游戏名称 | 代码 | 类型 | 锁定期限 |
|------|---------|------|------|---------|
| G001 | 舒尔特方格 | schulte | 免费 | - |
| G002 | 数字连连看 | number_matching | 付费 | 需会员 |
| G003 | 颜色识别 | color_recognition | 免费 | - |
| G004 | 图形记忆 | pattern_memory | 付费 | 需会员 |
| G005 | 反应速度 | reaction_speed | 付费 | 需会员 |
| G006 | 专注呼吸 | focus_breathing | 免费 | - |
| G007 | 找不同 | find_differences | 付费 | 需会员 |
| G008 | 数字方阵 | number_matrix | 付费 | 需会员 |
| G009 | 声音专注 | audio_focus | 付费 | 需会员 |

---

## 2. 数据库结构

### 2.1 membership 表（会员套餐）

```sql
CREATE TABLE `membership` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(64) NOT NULL COMMENT '会员名称',
  `tier` ENUM('free', 'basic', 'premium', 'vip') DEFAULT 'free',
  `price` DECIMAL(10,2) DEFAULT 0,
  `duration_days` INT DEFAULT 365,
  `benefits` JSON DEFAULT NULL COMMENT '会员权益列表',
  `features` JSON DEFAULT NULL COMMENT '功能列表',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 2.2 child_membership 表（儿童会员关联）

```sql
CREATE TABLE `child_membership` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `child_id` INT UNSIGNED NOT NULL COMMENT '儿童ID',
  `membership_id` INT UNSIGNED NOT NULL COMMENT '会员套餐ID',
  `order_id` INT UNSIGNED DEFAULT NULL COMMENT '订单ID',
  `start_date` DATE NOT NULL COMMENT '开始日期',
  `end_date` DATE NOT NULL COMMENT '结束日期',
  `status` TINYINT DEFAULT 1 COMMENT '0-过期, 1-有效',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 2.3 order 表（订单）

```sql
CREATE TABLE `order` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `order_no` VARCHAR(64) NOT NULL UNIQUE COMMENT '订单号',
  `user_id` INT UNSIGNED NOT NULL COMMENT '用户ID',
  `child_id` INT UNSIGNED DEFAULT NULL COMMENT '儿童ID（可选）',
  `membership_id` INT UNSIGNED NOT NULL COMMENT '会员套餐ID',
  `amount` DECIMAL(10,2) NOT NULL COMMENT '订单金额',
  `pay_status` TINYINT DEFAULT 0 COMMENT '0-待支付, 1-已支付, 2-已取消',
  `transaction_id` VARCHAR(128) DEFAULT NULL COMMENT '微信支付订单号',
  `pay_time` DATETIME DEFAULT NULL COMMENT '支付时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 3. API 端点

### 3.1 会员相关接口

| 端点 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/membership/status` | GET | 必需 | 获取当前用户会员状态 |
| `/api/membership/packages` | GET | 公开 | 获取可用会员套餐列表 |
| `/api/membership/create-order` | POST | 必需 | 创建订单 |
| `/api/membership/order/:orderNo` | GET | 必需 | 查询订单状态 |
| `/api/membership/pay` | POST | 必需 | 发起微信支付 |
| `/api/membership/callback` | POST | 公开 | 微信支付回调 |
| `/api/membership/history` | GET | 必需 | 获取购买历史 |

### 3.2 游戏相关接口

| 端点 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/game/list` | GET | 公开 | 获取游戏列表（含锁定状态） |
| `/api/game/categories` | GET | 公开 | 获取游戏分类 |
| `/api/game/search` | GET | 公开 | 搜索游戏 |
| `/api/game/:gameId` | GET | 必需 | 获取游戏详情 |
| `/api/game/record` | POST | 必需 | 提交游戏记录 |
| `/api/game/records` | GET | 必需 | 获取训练历史 |

---

## 4. 会员状态查询

### GET /api/membership/status

**响应示例:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "is_vip": true,
    "member_type": "yearly",
    "member_level": "vip",
    "start_date": "2024-01-01",
    "end_date": "2025-01-01",
    "days_remaining": 240,
    "features": ["all_games", "priority_support"]
  }
}
```

---

## 5. 会员开通方法

### 5.1 方法一：数据库直接操作

```sql
-- 查看当前会员套餐
SELECT * FROM membership;

-- 插入会员套餐（如果不存在）
INSERT INTO membership (name, tier, price, duration_days, features)
VALUES ('年度VIP', 'vip', 299.00, 365, '["all_games", "priority_support"]')
ON DUPLICATE KEY UPDATE name = name;

-- 给用户开通会员（user_level 模式）
UPDATE user SET membership_id = 1, membership_expire = DATE_ADD(NOW(), INTERVAL 1 YEAR)
WHERE id = 1;

-- 给儿童开通会员（child_membership 模式）
INSERT INTO child_membership (child_id, membership_id, start_date, end_date, status)
VALUES (1, 1, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 1);
```

### 5.2 方法二：SQL脚本开通会员

```sql
-- 为用户 user_id=1 的第一个孩子开通年度VIP
DECLARE @membership_id INT;
DECLARE @child_id INT;

-- 获取用户第一个孩子
SELECT id INTO @child_id FROM child WHERE user_id = 1 LIMIT 1;

-- 获取VIP套餐ID
SELECT id INTO @membership_id FROM membership WHERE tier = 'vip' LIMIT 1;

-- 开通会员
INSERT INTO child_membership (child_id, membership_id, start_date, end_date, status)
VALUES (@child_id, @membership_id, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 1);
```

### 5.3 方法三：管理员API（推荐）

添加管理员接口便于管理会员：

**POST /api/admin/membership/grant**

```bash
curl -X POST http://localhost:3000/api/admin/membership/grant \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "childId": 1,
    "tier": "vip",
    "durationDays": 365
  }'
```

---

## 6. 会员权益说明

| 权益 | free | basic | premium | vip |
|------|------|-------|--------|-----|
| 免费游戏 | ✅ | ✅ | ✅ | ✅ |
| 付费游戏 | ❌ | ✅ | ✅ | ✅ |
| VIP专属游戏 | ❌ | ❌ | ❌ | ✅ |
| 优先客服 | ❌ | ❌ | ✅ | ✅ |
| 专属报告 | ❌ | ❌ | ✅ | ✅ |
| AI推荐增强 | ❌ | ❌ | ❌ | ✅ |

---

## 7. 游戏访问控制逻辑

### 7.1 前端控制（显示层）
- 根据游戏列表返回的 `is_free` 或 `requires_vip` 字段显示锁定/解锁图标
- 非会员用户点击付费游戏时弹出升级会员提示

### 7.2 后端控制（执行层）

**推荐服务中的VIP检查** (`recommendationService.ts`):
```typescript
private static async hasVipAccess(childId: number): Promise<boolean> {
  const result = await query(
    `SELECT 1 FROM child_membership cm
     JOIN membership m ON cm.membership_id = m.id
     WHERE cm.child_id = ? AND cm.status = 1 AND cm.end_date >= CURDATE()
     AND m.tier != 'free' LIMIT 1`,
    [childId]
  )
  return result.length > 0
}

// 推荐算法中降低非VIP可玩游戏分数
if ((game as any).requires_vip && !await this.hasVipAccess(childId)) {
  score -= 40  // 降低VIP游戏对非VIP用户的推荐分数
}
```

### 7.3 当前限制

⚠️ **注意**: 目前后端对游戏提交记录 (`POST /api/game/record`) 没有验证用户会员状态。任何用户都可以提交任何游戏的记录。

建议后续添加：
```typescript
// 在 submitRecord 中添加会员验证
if (game.requires_vip && !await hasVipAccess(childId)) {
  throw new AppError('此游戏需要VIP会员', 403)
}
```

---

## 8. 会员套餐示例数据

```sql
INSERT INTO membership (name, tier, price, duration_days, benefits, features) VALUES
('免费版', 'free', 0, 0, '["free_games"]', '["basic_reports"]'),
('月度会员', 'basic', 29.90, 30, '["all_games", "basic_support"]', '["standard_reports"]'),
('季度会员', 'premium', 79.90, 90, '["all_games", "priority_support"]', '["advanced_reports"]'),
('年度VIP', 'vip', 299.00, 365, '["all_games", "vip_games", "priority_support", "exclusive_content"]', '["ai_recommendations", "priority_support"]');
```

---

## 9. 管理员API

### 9.1 开通会员接口

**POST /api/admin/members/grant**

管理员为用户开通会员。

**请求头:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**请求参数:**
```json
{
  "userId": 1,
  "childId": 1,
  "tier": "vip",
  "durationDays": 365
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | number | 是 | 用户ID |
| childId | number | 否 | 儿童ID（留空则为用户第一个孩子开通） |
| tier | string | 是 | 会员等级 (free/basic/premium/vip) |
| durationDays | number | 是 | 开通天数 |

**响应示例:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "childId": 3,
    "membershipId": 4,
    "tier": "vip",
    "startDate": "2026-05-05",
    "endDate": "2027-05-05",
    "status": 1
  }
}
```

**使用示例:**
```bash
# 获取管理员token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.data.token')

# 为用户开通VIP（30天）
curl -X POST http://localhost:3000/api/admin/members/grant \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"userId":1,"tier":"vip","durationDays":30}'

# 为用户开通年度VIP
curl -X POST http://localhost:3000/api/admin/members/grant \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"userId":1,"tier":"vip","durationDays":365}'
```

---

## 10. 联系我们

如需帮助或反馈问题，请联系技术支持。