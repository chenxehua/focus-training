-- FocusKids Database Initialization Script
-- Version: 1.0.0

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS focuskids CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE focuskids;

-- ============================================================
-- 用户表
-- ============================================================
CREATE TABLE IF NOT EXISTS `user` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `openid` VARCHAR(64) NOT NULL UNIQUE COMMENT '微信openid',
  `unionid` VARCHAR(64) DEFAULT NULL COMMENT '微信unionid',
  `nickname` VARCHAR(64) DEFAULT NULL COMMENT '昵称',
  `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
  `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号',
  `role` ENUM('parent', 'teacher', 'admin') DEFAULT 'parent' COMMENT '角色',
  `status` TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-正常',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_openid (`openid`),
  INDEX idx_unionid (`unionid`),
  INDEX idx_phone (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- ============================================================
-- 儿童表
-- ============================================================
CREATE TABLE IF NOT EXISTS `child` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL COMMENT '所属用户ID',
  `name` VARCHAR(32) NOT NULL COMMENT '儿童姓名',
  `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
  `birthday` DATE DEFAULT NULL COMMENT '生日',
  `age` TINYINT DEFAULT NULL COMMENT '年龄',
  `age_group` VARCHAR(10) DEFAULT NULL COMMENT '年龄段: 4-6, 7-9, 10-12',
  `gender` ENUM('male', 'female', 'unknown') DEFAULT 'unknown' COMMENT '性别',
  `level` INT DEFAULT 1 COMMENT '当前等级',
  `experience` INT DEFAULT 0 COMMENT '经验值',
  `privacy_consent` TINYINT DEFAULT 0 COMMENT '隐私同意: 0-未同意, 1-已同意',
  `consent_date` DATETIME DEFAULT NULL COMMENT '同意时间',
  `status` TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-正常',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
  INDEX idx_user_id (`user_id`),
  INDEX idx_age_group (`age_group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='儿童表';

-- ============================================================
-- 游戏表
-- ============================================================
CREATE TABLE IF NOT EXISTS `game` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `game_code` VARCHAR(32) NOT NULL UNIQUE COMMENT '游戏代码',
  `game_name` VARCHAR(64) NOT NULL COMMENT '游戏名称',
  `description` TEXT COMMENT '游戏描述',
  `icon` VARCHAR(255) DEFAULT NULL COMMENT '图标URL',
  `category` VARCHAR(32) DEFAULT NULL COMMENT '分类',
  `difficulty_levels` INT DEFAULT 5 COMMENT '难度级别数',
  `min_age` TINYINT DEFAULT 4 COMMENT '最小年龄',
  `max_age` TINYINT DEFAULT 12 COMMENT '最大年龄',
  `training_focus` VARCHAR(255) DEFAULT NULL COMMENT '训练焦点',
  `requires_vip` TINYINT DEFAULT 0 COMMENT '是否需要VIP',
  `sort_order` INT DEFAULT 0 COMMENT '排序',
  `status` TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-正常',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_game_code (`game_code`),
  INDEX idx_category (`category`),
  INDEX idx_sort_order (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='游戏表';

-- ============================================================
-- 训练记录表
-- ============================================================
CREATE TABLE IF NOT EXISTS `training_record` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `child_id` INT UNSIGNED NOT NULL COMMENT '儿童ID',
  `game_id` INT UNSIGNED NOT NULL COMMENT '游戏ID',
  `difficulty_level` TINYINT DEFAULT 1 COMMENT '难度级别',
  `score` INT DEFAULT 0 COMMENT '得分',
  `accuracy` DECIMAL(5,4) DEFAULT 0 COMMENT '准确率',
  `focus_score` INT DEFAULT 0 COMMENT '专注度评分',
  `duration_seconds` INT DEFAULT 0 COMMENT '训练时长(秒)',
  `game_config` JSON DEFAULT NULL COMMENT '游戏配置JSON',
  `result_data` JSON DEFAULT NULL COMMENT '游戏结果JSON',
  `completed` TINYINT DEFAULT 1 COMMENT '是否完成: 0-未完成, 1-完成',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`child_id`) REFERENCES `child`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`game_id`) REFERENCES `game`(`id`) ON DELETE CASCADE,
  INDEX idx_child_id (`child_id`),
  INDEX idx_game_id (`game_id`),
  INDEX idx_created_at (`created_at`),
  INDEX idx_child_game (`child_id`, `game_id`),
  INDEX idx_child_created (`child_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='训练记录表';

-- ============================================================
-- 成就表
-- ============================================================
CREATE TABLE IF NOT EXISTS `achievement` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `achievement_code` VARCHAR(32) NOT NULL UNIQUE COMMENT '成就代码',
  `name` VARCHAR(64) NOT NULL COMMENT '成就名称',
  `description` VARCHAR(255) DEFAULT NULL COMMENT '成就描述',
  `icon` VARCHAR(255) DEFAULT NULL COMMENT '图标URL',
  `type` VARCHAR(32) DEFAULT NULL COMMENT '类型: training, score, streak, milestone',
  `tier` ENUM('basic', 'intermediate', 'advanced', 'legendary') DEFAULT 'basic' COMMENT '等级',
  `requirement` JSON DEFAULT NULL COMMENT '解锁条件JSON',
  `reward_points` INT DEFAULT 0 COMMENT '奖励积分',
  `sort_order` INT DEFAULT 0 COMMENT '排序',
  `status` TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-正常',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_achievement_code (`achievement_code`),
  INDEX idx_type (`type`),
  INDEX idx_tier (`tier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='成就表';

-- ============================================================
-- 儿童成就解锁表
-- ============================================================
CREATE TABLE IF NOT EXISTS `child_achievement` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `child_id` INT UNSIGNED NOT NULL COMMENT '儿童ID',
  `achievement_id` INT UNSIGNED NOT NULL COMMENT '成就ID',
  `unlocked_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '解锁时间',
  `progress` INT DEFAULT 100 COMMENT '进度百分比',
  `notification_sent` TINYINT DEFAULT 0 COMMENT '通知是否已发送',
  FOREIGN KEY (`child_id`) REFERENCES `child`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`achievement_id`) REFERENCES `achievement`(`id`) ON DELETE CASCADE,
  UNIQUE KEY uk_child_achievement (`child_id`, `achievement_id`),
  INDEX idx_child_id (`child_id`),
  INDEX idx_unlocked_at (`unlocked_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='儿童成就解锁表';

-- ============================================================
-- 会员表
-- ============================================================
CREATE TABLE IF NOT EXISTS `membership` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(64) NOT NULL COMMENT '会员名称',
  `tier` ENUM('free', 'basic', 'premium', 'vip') DEFAULT 'free' COMMENT '等级',
  `price` DECIMAL(10,2) DEFAULT 0 COMMENT '价格',
  `duration_days` INT DEFAULT 365 COMMENT '时长(天)',
  `benefits` JSON DEFAULT NULL COMMENT '权益JSON',
  `features` JSON DEFAULT NULL COMMENT '功能JSON',
  `sort_order` INT DEFAULT 0 COMMENT '排序',
  `status` TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-正常',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tier (`tier`),
  INDEX idx_price (`price`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='会员表';

-- ============================================================
-- 订单表
-- ============================================================
CREATE TABLE IF NOT EXISTS `order` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `order_no` VARCHAR(64) NOT NULL UNIQUE COMMENT '订单号',
  `user_id` INT UNSIGNED NOT NULL COMMENT '用户ID',
  `child_id` INT UNSIGNED DEFAULT NULL COMMENT '儿童ID',
  `membership_id` INT UNSIGNED DEFAULT NULL COMMENT '会员ID',
  `amount` DECIMAL(10,2) NOT NULL COMMENT '金额',
  `status` ENUM('pending', 'paid', 'cancelled', 'refunded') DEFAULT 'pending' COMMENT '状态',
  `pay_method` VARCHAR(32) DEFAULT NULL COMMENT '支付方式',
  `pay_time` DATETIME DEFAULT NULL COMMENT '支付时间',
  `transaction_id` VARCHAR(128) DEFAULT NULL COMMENT '微信交易单号',
  `ext_data` JSON DEFAULT NULL COMMENT '扩展数据',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`membership_id`) REFERENCES `membership`(`id`) ON DELETE SET NULL,
  INDEX idx_order_no (`order_no`),
  INDEX idx_user_id (`user_id`),
  INDEX idx_status (`status`),
  INDEX idx_pay_time (`pay_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';

-- ============================================================
-- 儿童会员表
-- ============================================================
CREATE TABLE IF NOT EXISTS `child_membership` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `child_id` INT UNSIGNED NOT NULL COMMENT '儿童ID',
  `membership_id` INT UNSIGNED NOT NULL COMMENT '会员ID',
  `order_id` INT UNSIGNED DEFAULT NULL COMMENT '订单ID',
  `start_date` DATE NOT NULL COMMENT '开始日期',
  `end_date` DATE NOT NULL COMMENT '结束日期',
  `status` TINYINT DEFAULT 1 COMMENT '状态: 0-过期, 1-有效',
  `auto_renew` TINYINT DEFAULT 0 COMMENT '是否自动续费',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`child_id`) REFERENCES `child`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`membership_id`) REFERENCES `membership`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`order_id`) REFERENCES `order`(`id`) ON DELETE SET NULL,
  UNIQUE KEY uk_child_membership (`child_id`, `membership_id`),
  INDEX idx_child_id (`child_id`),
  INDEX idx_end_date (`end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='儿童会员表';

-- ============================================================
-- 专注力报告表
-- ============================================================
CREATE TABLE IF NOT EXISTS `focus_report` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `child_id` INT UNSIGNED NOT NULL COMMENT '儿童ID',
  `report_type` VARCHAR(32) DEFAULT 'weekly' COMMENT '报告类型: daily, weekly, monthly',
  `period_start` DATE NOT NULL COMMENT '统计周期开始',
  `period_end` DATE NOT NULL COMMENT '统计周期结束',
  `dimensions` JSON DEFAULT NULL COMMENT '7维度数据JSON',
  `overall_score` INT DEFAULT 0 COMMENT '综合评分',
  `summary` TEXT COMMENT '综合摘要',
  `recommendations` JSON DEFAULT NULL COMMENT '建议JSON',
  `training_count` INT DEFAULT 0 COMMENT '训练次数',
  `total_duration` INT DEFAULT 0 COMMENT '总时长(秒)',
  `generated_by` VARCHAR(32) DEFAULT 'system' COMMENT '生成方式: system, ai',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`child_id`) REFERENCES `child`(`id`) ON DELETE CASCADE,
  INDEX idx_child_id (`child_id`),
  INDEX idx_report_type (`report_type`),
  INDEX idx_period (`period_start`, `period_end`),
  INDEX idx_created_at (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='专注力报告表';

-- ============================================================
-- 初始数据
-- ============================================================

-- 插入游戏数据
INSERT INTO `game` (`game_code`, `game_name`, `description`, `category`, `difficulty_levels`, `training_focus`, `requires_vip`, `sort_order`) VALUES
('schulte', '舒尔特方格', '舒尔特方格是经典的视觉注意力训练工具，通过在方格中寻找并按顺序点击数字来训练视觉扫描能力和专注力', 'visual', 5, '视觉搜索,持续注意', 0, 1),
('audio_count', '听声辨数', '仔细听系统播放的声音序列，选择听到的数量', 'auditory', 5, '听觉注意,工作记忆', 0, 2),
('pattern_memory', '图案记忆', '记住并匹配不同的图案组合', 'memory', 5, '视觉记忆,模式识别', 0, 3),
('visual_tracking', '视觉追踪', '追踪移动的目标同时忽略干扰物', 'visual', 5, '视觉追踪,抗干扰', 0, 0),
('rhythm_tap', '节奏点击', '跟随音乐节拍进行点击训练', 'rhythm', 5, '节奏感知,反应控制', 1, 4),
('auditory_memory', '听觉记忆', '小侦探听口令，记住并复述数字序列', 'memory', 5, '听觉注意,序列记忆', 1, 5),
('maze_navigation', '迷宫寻路', '小熊找蜂蜜，通过迷宫到达目标', 'spatial', 5, '空间认知,执行功能', 1, 6),
('quick_sort', '快速分类', '物品整理小能手，快速将物品分类', 'cognitive', 5, '认知灵活,注意转移', 1, 7),
('target_tracking', '追踪目标', '追踪小星星，在干扰下保持注意力', 'visual', 5, '选择性注意,抗干扰', 1, 8);

-- 插入会员套餐
INSERT INTO `membership` (`name`, `tier`, `price`, `duration_days`, `benefits`, `features`, `sort_order`) VALUES
('免费版', 'free', 0.00, 0, '["3个基础游戏", "每日5次训练", "基础报告"]', '["schulte", "audio_count", "pattern_memory"]', 1),
('年度会员', 'basic', 199.00, 365, '["全部9个游戏", "无限训练", "完整报告", "成就系统", "AI推荐"]', '["all_games", "unlimited", "full_reports", "achievements", "ai_recommend"]', 2),
('高级会员', 'premium', 399.00, 365, '["年度会员全部权益", "高级游戏皮肤", "深度分析报告", "优先客服"]', '["basic_features", "premium_skins", "deep_reports", "priority_support"]', 3);

-- 插入成就数据
INSERT INTO `achievement` (`achievement_code`, `name`, `description`, `type`, `tier`, `requirement`, `reward_points`, `sort_order`) VALUES
('first_training', '初次训练', '完成第一次专注力训练', 'training', 'basic', '{"type": "training_count", "value": 1}', 10, 1),
('training_10', '训练新手', '累计完成10次训练', 'training', 'basic', '{"type": "training_count", "value": 10}', 50, 2),
('training_50', '训练达人', '累计完成50次训练', 'training', 'intermediate', '{"type": "training_count", "value": 50}', 200, 3),
('training_100', '训练大师', '累计完成100次训练', 'training', 'advanced', '{"type": "training_count", "value": 100}', 500, 4),
('perfect_score', '满分达成', '在任一游戏中获得满分', 'score', 'intermediate', '{"type": "perfect_score", "value": 1}', 100, 5),
('streak_3', '连续3天', '连续3天完成训练', 'streak', 'basic', '{"type": "streak", "value": 3}', 30, 6),
('streak_7', '连续一周', '连续7天完成训练', 'streak', 'intermediate', '{"type": "streak", "value": 7}', 100, 7),
('streak_30', '坚持一个月', '连续30天完成训练', 'streak', 'advanced', '{"type": "streak", "value": 30}', 500, 8),
('star_100', '百星闪耀', '累计获得100颗星星', 'milestone', 'intermediate', '{"type": "stars", "value": 100}', 200, 9),
('schulte_master', '舒尔特大师', '舒尔特方格达到9级难度', 'milestone', 'advanced', '{"type": "game_level", "game": "schulte", "level": 9}', 300, 10);
-- ============================================================
-- 家长学院表
-- ============================================================
CREATE TABLE IF NOT EXISTS `academy_category` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `category_name` VARCHAR(64) NOT NULL COMMENT '分类名称',
  `category_name_en` VARCHAR(64) DEFAULT NULL COMMENT '分类英文名',
  `category_icon` VARCHAR(255) DEFAULT NULL COMMENT '分类图标',
  `sort_order` INT DEFAULT 0 COMMENT '排序',
  `article_count` INT DEFAULT 0 COMMENT '文章数量',
  `is_active` TINYINT DEFAULT 1 COMMENT '是否启用: 0-禁用, 1-启用',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sort_order (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='家长学院分类表';

CREATE TABLE IF NOT EXISTS `academy_article` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `category_id` INT UNSIGNED NOT NULL COMMENT '分类ID',
  `title` VARCHAR(128) NOT NULL COMMENT '标题',
  `cover_image` VARCHAR(255) DEFAULT NULL COMMENT '封面图',
  `summary` TEXT COMMENT '摘要',
  `content` TEXT COMMENT '内容(富文本)',
  `author` VARCHAR(64) DEFAULT NULL COMMENT '作者',
  `tags` VARCHAR(255) DEFAULT NULL COMMENT '标签,逗号分隔',
  `read_count` INT DEFAULT 0 COMMENT '阅读数',
  `like_count` INT DEFAULT 0 COMMENT '点赞数',
  `is_featured` TINYINT DEFAULT 0 COMMENT '是否推荐: 0-否, 1-是',
  `reading_time` INT DEFAULT 5 COMMENT '阅读时长(分钟)',
  `is_published` TINYINT DEFAULT 0 COMMENT '是否发布: 0-草稿, 1-已发布',
  `is_deleted` TINYINT DEFAULT 0 COMMENT '是否删除: 0-否, 1-是',
  `publish_date` DATETIME DEFAULT NULL COMMENT '发布时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`category_id`) REFERENCES `academy_category`(`id`) ON DELETE CASCADE,
  INDEX idx_category_id (`category_id`),
  INDEX idx_is_published (`is_published`),
  INDEX idx_publish_date (`publish_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='家长学院文章表';

CREATE TABLE IF NOT EXISTS `academy_question_category` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `category_name` VARCHAR(64) NOT NULL COMMENT '分类名称',
  `icon` VARCHAR(255) DEFAULT NULL COMMENT '图标',
  `sort_order` INT DEFAULT 0 COMMENT '排序',
  `is_active` TINYINT DEFAULT 1 COMMENT '是否启用: 0-禁用, 1-启用',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='问答分类表';

CREATE TABLE IF NOT EXISTS `academy_question` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL COMMENT '提问用户ID',
  `category_id` INT UNSIGNED DEFAULT NULL COMMENT '分类ID',
  `question_title` VARCHAR(128) NOT NULL COMMENT '问题标题',
  `question_content` TEXT COMMENT '问题内容',
  `images` TEXT COMMENT '图片JSON数组',
  `status` TINYINT DEFAULT 0 COMMENT '状态: 0-待回答, 1-已回答, 2-已关闭',
  `view_count` INT DEFAULT 0 COMMENT '浏览数',
  `like_count` INT DEFAULT 0 COMMENT '点赞数',
  `answered_at` DATETIME DEFAULT NULL COMMENT '回答时间',
  `is_deleted` TINYINT DEFAULT 0 COMMENT '是否删除: 0-否, 1-是',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (`user_id`),
  INDEX idx_category_id (`category_id`),
  INDEX idx_status (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='问答表';

CREATE TABLE IF NOT EXISTS `academy_answer` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `question_id` INT UNSIGNED NOT NULL COMMENT '问题ID',
  `user_id` INT UNSIGNED NOT NULL COMMENT '回答用户ID',
  `answer_content` TEXT NOT NULL COMMENT '回答内容',
  `is_expert` TINYINT DEFAULT 0 COMMENT '是否专家回答: 0-否, 1-是',
  `is_official` TINYINT DEFAULT 0 COMMENT '是否官方回答: 0-否, 1-是',
  `like_count` INT DEFAULT 0 COMMENT '点赞数',
  `is_deleted` TINYINT DEFAULT 0 COMMENT '是否删除: 0-否, 1-是',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`question_id`) REFERENCES `academy_question`(`id`) ON DELETE CASCADE,
  INDEX idx_question_id (`question_id`),
  INDEX idx_is_expert (`is_expert`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='回答表';

-- ============================================================
-- 学校管理表
-- ============================================================
CREATE TABLE IF NOT EXISTS `school` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `school_name` VARCHAR(128) NOT NULL COMMENT '学校名称',
  `school_code` VARCHAR(32) UNIQUE COMMENT '学校代码',
  `province` VARCHAR(32) DEFAULT NULL COMMENT '省份',
  `city` VARCHAR(32) DEFAULT NULL COMMENT '城市',
  `district` VARCHAR(32) DEFAULT NULL COMMENT '区县',
  `address` VARCHAR(255) DEFAULT NULL COMMENT '详细地址',
  `contact_name` VARCHAR(64) DEFAULT NULL COMMENT '联系人',
  `contact_phone` VARCHAR(20) DEFAULT NULL COMMENT '联系电话',
  `status` TINYINT DEFAULT 0 COMMENT '状态: 0-待审核, 1-已通过, 2-已拒绝',
  `student_count` INT DEFAULT 0 COMMENT '学生数',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_school_code (`school_code`),
  INDEX idx_status (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学校表';

CREATE TABLE IF NOT EXISTS `teacher` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL COMMENT '用户ID',
  `school_id` INT UNSIGNED NOT NULL COMMENT '学校ID',
  `teacher_name` VARCHAR(64) NOT NULL COMMENT '教师姓名',
  `subject` VARCHAR(32) DEFAULT NULL COMMENT '科目',
  `role` TINYINT DEFAULT 2 COMMENT '角色: 1-管理员, 2-班主任, 3-科目老师, 4-心理老师',
  `status` TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-正常',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`school_id`) REFERENCES `school`(`id`) ON DELETE CASCADE,
  INDEX idx_user_id (`user_id`),
  INDEX idx_school_id (`school_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='教师表';

CREATE TABLE IF NOT EXISTS `class` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `school_id` INT UNSIGNED NOT NULL COMMENT '学校ID',
  `class_name` VARCHAR(64) NOT NULL COMMENT '班级名称',
  `grade` VARCHAR(16) DEFAULT NULL COMMENT '年级',
  `year` INT DEFAULT NULL COMMENT '学年',
  `capacity` INT DEFAULT 50 COMMENT '容量',
  `student_count` INT DEFAULT 0 COMMENT '学生数',
  `teacher_id` INT UNSIGNED DEFAULT NULL COMMENT '班主任ID',
  `status` TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-正常',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`school_id`) REFERENCES `school`(`id`) ON DELETE CASCADE,
  INDEX idx_school_id (`school_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='班级表';

CREATE TABLE IF NOT EXISTS `class_student` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `class_id` INT UNSIGNED NOT NULL COMMENT '班级ID',
  `child_id` INT UNSIGNED NOT NULL COMMENT '学生ID',
  `join_date` DATE DEFAULT NULL COMMENT '加入日期',
  `status` TINYINT DEFAULT 1 COMMENT '状态: 0-离班, 1-在读',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`class_id`) REFERENCES `class`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`child_id`) REFERENCES `child`(`id`) ON DELETE CASCADE,
  UNIQUE KEY uk_class_child (`class_id`, `child_id`),
  INDEX idx_child_id (`child_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='班级学生表';

-- ============================================================
-- 家长儿童关联表 (补充)
-- ============================================================
CREATE TABLE IF NOT EXISTS `parent_child` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL COMMENT '家长ID',
  `child_id` INT UNSIGNED NOT NULL COMMENT '儿童ID',
  `relation` VARCHAR(32) DEFAULT 'parent' COMMENT '关系: parent, guardian',
  `is_default` TINYINT DEFAULT 0 COMMENT '是否默认: 0-否, 1-是',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`child_id`) REFERENCES `child`(`id`) ON DELETE CASCADE,
  UNIQUE KEY uk_user_child (`user_id`, `child_id`),
  INDEX idx_child_id (`child_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='家长儿童关联表';
