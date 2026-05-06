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
  ('G001', '舒尔特方格', '注意力', 5, '4-12', '在N×N方格中按顺序点击1-N数字，训练视觉搜索效率和注意力稳定性', 1, 1),
  ('G002', '听声辨数', '听觉', 5, '4-12', '仔细听系统播放的声音序列，选择听到的数量，训练听觉注意力和反应速度', 1, 2),
  ('G003', '图案记忆', '记忆', 5, '4-12', '记住并匹配不同的图案组合，训练视觉记忆和模式识别能力', 1, 3),
  ('G004', '视觉追踪', '注意力', 5, '4-12', '追踪移动的目标同时忽略干扰物，训练视觉追踪和持续注意力', 1, 4),
  ('G005', '节奏点击', '感知', 5, '4-12', '听到指定节奏时点击，其他时候不点，训练警觉网络和反应抑制能力', 0, 5),
  ('G006', '听觉记忆', '记忆', 5, '4-12', '听口令后按顺序或倒序复述数字，训练听觉工作记忆和顺序记忆', 0, 6),
  ('G007', '迷宫寻路', '观察', 5, '4-12', '在迷宫中找到从起点到终点的路径，训练空间认知和执行功能', 0, 7),
  ('G008', '快速分类', '计算', 5, '4-12', '根据规则快速将物品分类，规则会切换，训练认知灵活性和注意力转移', 0, 8),
  ('G009', '追踪目标', '注意力', 5, '4-12', '在复杂场景中找到并追踪目标，出现变化时点击，训练选择性注意和抗干扰能力', 0, 9)
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
