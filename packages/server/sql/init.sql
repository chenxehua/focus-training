-- ============================================================
-- 儿童专注力训练小程序 数据库初始化脚本
-- MySQL 8.0+
-- charset: utf8mb4
-- ============================================================

CREATE DATABASE IF NOT EXISTS `focus_training`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `focus_training`;

-- ============================================================
-- 家长用户表
-- ============================================================
CREATE TABLE IF NOT EXISTS `user` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `openid`      VARCHAR(64)     NOT NULL COMMENT '微信 openid',
  `phone`       VARCHAR(20)     DEFAULT NULL COMMENT '手机号',
  `nickname`    VARCHAR(50)     DEFAULT NULL COMMENT '昵称',
  `avatar`      VARCHAR(500)    DEFAULT NULL COMMENT '头像 URL',
  `role`        ENUM('parent','admin') NOT NULL DEFAULT 'parent',
  `status`      ENUM('active','banned') NOT NULL DEFAULT 'active',
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_openid` (`openid`),
  KEY `idx_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='家长用户表';

-- ============================================================
-- 儿童信息表
-- ============================================================
CREATE TABLE IF NOT EXISTS `child` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(20)     NOT NULL COMMENT '孩子姓名',
  `age`         TINYINT UNSIGNED NOT NULL COMMENT '年龄',
  `gender`      ENUM('male','female') NOT NULL DEFAULT 'male',
  `avatar`      VARCHAR(500)    DEFAULT NULL COMMENT '头像 URL',
  `age_group`   ENUM('4-6','7-9','10-12') NOT NULL COMMENT '年龄段',
  `level`       SMALLINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '等级',
  `experience`  INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT '经验值',
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_age_group` (`age_group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='儿童信息表';

-- ============================================================
-- 家长-孩子关联表（支持一个孩子被多个家长管理）
-- ============================================================
CREATE TABLE IF NOT EXISTS `parent_child` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    BIGINT UNSIGNED NOT NULL COMMENT '家长 ID',
  `child_id`   BIGINT UNSIGNED NOT NULL COMMENT '孩子 ID',
  `created_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_parent_child` (`user_id`, `child_id`),
  KEY `idx_child_id` (`child_id`),
  CONSTRAINT `fk_pc_user`  FOREIGN KEY (`user_id`)  REFERENCES `user`  (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pc_child` FOREIGN KEY (`child_id`) REFERENCES `child` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='家长孩子关联表';

-- ============================================================
-- 游戏列表表
-- ============================================================
CREATE TABLE IF NOT EXISTS `game` (
  `id`                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `game_code`         VARCHAR(20)  NOT NULL COMMENT '游戏编号 G001~G009',
  `game_name`         VARCHAR(50)  NOT NULL COMMENT '游戏名称',
  `game_type`         VARCHAR(20)  NOT NULL COMMENT '游戏类型（注意力/记忆/反应等）',
  `icon_url`          VARCHAR(500) DEFAULT NULL COMMENT '游戏图标',
  `difficulty_levels` TINYINT UNSIGNED NOT NULL DEFAULT 3 COMMENT '难度等级数',
  `target_age_group`  VARCHAR(20)  NOT NULL DEFAULT '4-12' COMMENT '适用年龄段',
  `description`       VARCHAR(200) DEFAULT NULL COMMENT '游戏简介',
  `is_free`           TINYINT(1)   NOT NULL DEFAULT 1 COMMENT '是否免费 1=免费 0=付费',
  `status`            ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `sort_order`        INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '排序权重',
  `created_at`        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_game_code` (`game_code`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏列表表';

-- ============================================================
-- 训练记录表
-- ============================================================
CREATE TABLE IF NOT EXISTS `training_record` (
  `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `child_id`         BIGINT UNSIGNED NOT NULL COMMENT '孩子 ID',
  `game_id`          BIGINT UNSIGNED NOT NULL COMMENT '游戏 ID',
  `duration_seconds` INT UNSIGNED    NOT NULL COMMENT '训练时长（秒）',
  `accuracy`         TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '准确率 0-100',
  `score`            INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT '得分',
  `focus_score`      TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '专注力得分 0-100',
  `difficulty_level` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '难度等级',
  `game_config`      JSON            DEFAULT NULL COMMENT '游戏配置快照',
  `result_data`      JSON            DEFAULT NULL COMMENT '游戏结果详情',
  `created_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_child_created`  (`child_id`, `created_at`),
  KEY `idx_game_id`        (`game_id`),
  KEY `idx_created_at`     (`created_at`),
  CONSTRAINT `fk_tr_child` FOREIGN KEY (`child_id`) REFERENCES `child` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tr_game`  FOREIGN KEY (`game_id`)  REFERENCES `game`  (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='训练记录表';

-- ============================================================
-- 成就表
-- ============================================================
CREATE TABLE IF NOT EXISTS `achievement` (
  `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `child_id`         BIGINT UNSIGNED NOT NULL COMMENT '孩子 ID',
  `achievement_code` VARCHAR(50)     NOT NULL COMMENT '成就代码',
  `progress`         INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT '进度值',
  `unlocked_at`      DATETIME        DEFAULT NULL COMMENT '解锁时间',
  `created_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_child_achievement` (`child_id`, `achievement_code`),
  KEY `idx_child_id` (`child_id`),
  CONSTRAINT `fk_ach_child` FOREIGN KEY (`child_id`) REFERENCES `child` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='成就记录表';

-- ============================================================
-- 会员信息表
-- ============================================================
CREATE TABLE IF NOT EXISTS `membership` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`     BIGINT UNSIGNED NOT NULL COMMENT '家长用户 ID',
  `member_type` ENUM('month','quarter','year','lifetime') NOT NULL COMMENT '会员类型',
  `start_date`  DATE            NOT NULL COMMENT '开始日期',
  `end_date`    DATE            DEFAULT NULL COMMENT '结束日期（lifetime 为 NULL）',
  `status`      ENUM('active','expired','cancelled') NOT NULL DEFAULT 'active',
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_status` (`user_id`, `status`),
  CONSTRAINT `fk_mem_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会员信息表';

-- ============================================================
-- 专注力报告表
-- ============================================================
CREATE TABLE IF NOT EXISTS `focus_report` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `child_id`        BIGINT UNSIGNED NOT NULL COMMENT '孩子 ID',
  `report_type`     ENUM('daily','weekly') NOT NULL COMMENT '报告类型',
  `report_date`     DATE            NOT NULL COMMENT '报告日期（日报=当天，周报=周一）',
  `training_count`  INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT '训练次数',
  `total_duration`  INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT '总训练时长（秒）',
  `avg_focus_score` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '平均专注得分',
  `trend_data`      JSON            DEFAULT NULL COMMENT '趋势数据（每天）',
  `highlights`      JSON            DEFAULT NULL COMMENT '亮点列表',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_child_type_date` (`child_id`, `report_type`, `report_date`),
  KEY `idx_child_date` (`child_id`, `report_date`),
  CONSTRAINT `fk_fr_child` FOREIGN KEY (`child_id`) REFERENCES `child` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='专注力报告表';

-- ============================================================
-- 初始游戏数据（9款游戏）
-- ============================================================
INSERT INTO `game`
  (`game_code`, `game_name`, `game_type`, `difficulty_levels`, `target_age_group`, `description`, `is_free`, `sort_order`)
VALUES
  ('G001', '舒尔特方格', '注意力', 3, '4-12',  '在最短时间内按顺序找出方格中的所有数字，训练视觉注意力和眼动速度', 1, 1),
  ('G002', '数字连连看', '注意力', 3, '4-12',  '将相邻的相同数字连接起来，考验持续注意力和视觉搜索能力',           0, 2),
  ('G003', '颜色识别',   '感知',   3, '4-6',   '快速辨认颜色和形状，培养感知辨别能力',                               0, 3),
  ('G004', '图形记忆',   '记忆',   3, '6-12',  '记住并复现图形序列，增强视觉工作记忆',                               0, 4),
  ('G005', '反应速度',   '反应',   3, '7-12',  '在信号出现时快速做出反应，训练神经反应速度',                         0, 5),
  ('G006', '专注呼吸',   '冥想',   1, '4-12',  '通过引导呼吸练习，帮助孩子进入专注状态，缓解焦虑',                   1, 6),
  ('G007', '找不同',     '观察',   3, '6-12',  '找出两幅图画之间的差异，锻炼细节观察力和持续注意力',                 0, 7),
  ('G008', '数字方阵',   '计算',   3, '8-12',  '填写数字使行列乘积相等，同时训练专注力和逻辑思维',                   0, 8),
  ('G009', '声音专注',   '听觉',   2, '5-12',  '辨别和记忆音频序列，开发听觉注意力和听觉记忆',                       0, 9)
ON DUPLICATE KEY UPDATE
  `game_name`         = VALUES(`game_name`),
  `game_type`         = VALUES(`game_type`),
  `difficulty_levels` = VALUES(`difficulty_levels`),
  `description`       = VALUES(`description`);

-- ============================================================
-- 确认初始化完成
-- ============================================================
SELECT
  'Database initialized successfully' AS message,
  (SELECT COUNT(*) FROM game) AS game_count;
