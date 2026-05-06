-- ============================================
-- 分龄分级初次测评系统 - 数据库表设计
-- 版本: V1.0
-- 日期: 2025年5月
-- ============================================

-- ----------------------------
-- 1. 测评记录表 (assessment)
-- ----------------------------
DROP TABLE IF EXISTS `assessment`;
CREATE TABLE `assessment` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  `assessment_no` VARCHAR(32) NOT NULL UNIQUE COMMENT '测评编号，格式：ASM+YYYYMMDD+序号',
  `child_id` INT UNSIGNED NOT NULL COMMENT '儿童ID',
  `assessment_type` ENUM('initial', 'followup', 'monthly') DEFAULT 'initial' COMMENT '测评类型：initial-初次测评, followup-复测, monthly-月度测评',
  `status` ENUM('not_started', 'in_progress', 'completed', 'abandoned') DEFAULT 'not_started' COMMENT '状态：not_started-未开始, in_progress-进行中, completed-已完成, abandoned-已放弃',
  `current_stage` ENUM('questionnaire', 'games', 'report') DEFAULT 'questionnaire' COMMENT '当前阶段：questionnaire-问卷, games-游戏, report-报告',
  `started_at` DATETIME DEFAULT NULL COMMENT '开始时间',
  `completed_at` DATETIME DEFAULT NULL COMMENT '完成时间',
  `estimated_duration` INT DEFAULT 0 COMMENT '预计时长(分钟)',
  `actual_duration` INT DEFAULT 0 COMMENT '实际时长(分钟)',
  `source` VARCHAR(32) DEFAULT 'miniapp' COMMENT '来源：miniapp-小程序, admin-后台, school-学校',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`child_id`) REFERENCES `child`(`id`) ON DELETE CASCADE,
  INDEX `idx_child_id` (`child_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_assessment_no` (`assessment_no`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='测评记录表';

-- ----------------------------
-- 2. 测评问卷答案表 (assessment_questionnaire_answer)
-- ----------------------------
DROP TABLE IF EXISTS `assessment_questionnaire_answer`;
CREATE TABLE `assessment_questionnaire_answer` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  `assessment_id` INT UNSIGNED NOT NULL COMMENT '测评ID',
  `question_id` INT UNSIGNED NOT NULL COMMENT '题目ID',
  `answer_value` INT DEFAULT NULL COMMENT '答案值（选项索引）',
  `answer_text` VARCHAR(255) DEFAULT NULL COMMENT '答案文本（其他选项时）',
  `score` INT DEFAULT 0 COMMENT '得分',
  `dimension` VARCHAR(32) DEFAULT NULL COMMENT '所属维度代码',
  `answered_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`assessment_id`) REFERENCES `assessment`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`question_id`) REFERENCES `assessment_question`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_assessment_question` (`assessment_id`, `question_id`),
  INDEX `idx_assessment_id` (`assessment_id`),
  INDEX `idx_dimension` (`dimension`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='测评问卷答案表';

-- ----------------------------
-- 3. 测评游戏结果表 (assessment_game_result)
-- ----------------------------
DROP TABLE IF EXISTS `assessment_game_result`;
CREATE TABLE `assessment_game_result` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  `assessment_id` INT UNSIGNED NOT NULL COMMENT '测评ID',
  `game_id` INT UNSIGNED NOT NULL COMMENT '游戏ID',
  `game_code` VARCHAR(32) NOT NULL COMMENT '游戏代码',
  `difficulty_level` TINYINT DEFAULT 1 COMMENT '难度级别',
  `score` INT DEFAULT 0 COMMENT '得分',
  `accuracy` DECIMAL(5,4) DEFAULT 0 COMMENT '准确率(0-1)',
  `duration` INT DEFAULT 0 COMMENT '用时(秒)',
  `focus_score` INT DEFAULT 0 COMMENT '专注度评分',
  `raw_data` JSON DEFAULT NULL COMMENT '原始数据JSON',
  `percentile` INT DEFAULT NULL COMMENT '百分位排名',
  `rating` VARCHAR(32) DEFAULT NULL COMMENT '评级：优秀/良好/正常/需关注/建议评估',
  `completed` TINYINT DEFAULT 0 COMMENT '是否完成：0-未完成, 1-完成',
  `started_at` DATETIME DEFAULT NULL COMMENT '开始时间',
  `completed_at` DATETIME DEFAULT NULL COMMENT '完成时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`assessment_id`) REFERENCES `assessment`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`game_id`) REFERENCES `game`(`id`) ON DELETE CASCADE,
  INDEX `idx_assessment_id` (`assessment_id`),
  INDEX `idx_game_code` (`game_code`),
  INDEX `idx_percentile` (`percentile`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='测评游戏结果表';

-- ----------------------------
-- 4. 测评题目表 (assessment_question)
-- ----------------------------
DROP TABLE IF EXISTS `assessment_question`;
CREATE TABLE `assessment_question` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  `question_code` VARCHAR(32) NOT NULL UNIQUE COMMENT '题目代码',
  `dimension` VARCHAR(32) NOT NULL COMMENT '所属维度代码',
  `dimension_name` VARCHAR(64) DEFAULT NULL COMMENT '维度中文名称',
  `question_type` ENUM('single_choice', 'multi_choice', 'scale') DEFAULT 'single_choice' COMMENT '题目类型',
  `question_early` TEXT COMMENT '幼儿组题目(4-5岁)',
  `question_mid` TEXT COMMENT '学前期题目(6-7岁)',
  `question_late` TEXT COMMENT '小学低年级题目(8-9岁)',
  `question_all` TEXT COMMENT '通用题目(10-12岁)',
  `options_early` JSON DEFAULT NULL COMMENT '幼儿组选项JSON',
  `options_mid` JSON DEFAULT NULL COMMENT '学前期选项JSON',
  `options_late` JSON DEFAULT NULL COMMENT '小学低年级选项JSON',
  `options_all` JSON DEFAULT NULL COMMENT '通用选项JSON',
  `weight` DECIMAL(3,2) DEFAULT 1.00 COMMENT '权重系数',
  `sort_order` INT DEFAULT 0 COMMENT '排序序号',
  `is_active` TINYINT DEFAULT 1 COMMENT '是否启用：0-禁用, 1-启用',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_dimension` (`dimension`),
  INDEX `idx_sort_order` (`sort_order`),
  INDEX `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='测评题目表';

-- ----------------------------
-- 5. 百分位常模表 (percentile_norm)
-- ----------------------------
DROP TABLE IF EXISTS `percentile_norm`;
CREATE TABLE `percentile_norm` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  `dimension` VARCHAR(32) NOT NULL COMMENT '维度代码',
  `dimension_name` VARCHAR(64) DEFAULT NULL COMMENT '维度中文名称',
  `age_group` VARCHAR(10) NOT NULL COMMENT '年龄组：4-5, 6-7, 8-9, 10-12',
  `age_min` TINYINT DEFAULT NULL COMMENT '最小年龄',
  `age_max` TINYINT DEFAULT NULL COMMENT '最大年龄',
  `sample_size` INT DEFAULT 0 COMMENT '样本量',
  `mean` DECIMAL(10,4) DEFAULT 0 COMMENT '平均值',
  `std_dev` DECIMAL(10,4) DEFAULT 0 COMMENT '标准差',
  `p5` DECIMAL(10,4) DEFAULT 0 COMMENT 'P5百分位',
  `p10` DECIMAL(10,4) DEFAULT 0 COMMENT 'P10百分位',
  `p20` DECIMAL(10,4) DEFAULT 0 COMMENT 'P20百分位',
  `p30` DECIMAL(10,4) DEFAULT 0 COMMENT 'P30百分位',
  `p40` DECIMAL(10,4) DEFAULT 0 COMMENT 'P40百分位',
  `p50` DECIMAL(10,4) DEFAULT 0 COMMENT 'P50百分位（中位数）',
  `p60` DECIMAL(10,4) DEFAULT 0 COMMENT 'P60百分位',
  `p70` DECIMAL(10,4) DEFAULT 0 COMMENT 'P70百分位',
  `p80` DECIMAL(10,4) DEFAULT 0 COMMENT 'P80百分位',
  `p90` DECIMAL(10,4) DEFAULT 0 COMMENT 'P90百分位',
  `p95` DECIMAL(10,4) DEFAULT 0 COMMENT 'P95百分位',
  `norm_version` VARCHAR(20) DEFAULT NULL COMMENT '常模版本',
  `region` VARCHAR(32) DEFAULT 'national' COMMENT '地区：national-全国, regional-地区',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_dimension_age` (`dimension`, `age_group`),
  INDEX `idx_age_group` (`age_group`),
  INDEX `idx_dimension` (`dimension`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='百分位常模表';

-- ----------------------------
-- 6. 测评报告表 (assessment_report)
-- ----------------------------
DROP TABLE IF EXISTS `assessment_report`;
CREATE TABLE `assessment_report` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  `report_no` VARCHAR(32) NOT NULL UNIQUE COMMENT '报告编号，格式：RPT+YYYYMMDD+序号',
  `assessment_id` INT UNSIGNED NOT NULL COMMENT '测评ID',
  `child_id` INT UNSIGNED NOT NULL COMMENT '儿童ID',
  `child_name` VARCHAR(32) DEFAULT NULL COMMENT '儿童姓名（冗余字段）',
  `child_age` TINYINT DEFAULT NULL COMMENT '儿童年龄（冗余字段）',
  `child_age_group` VARCHAR(10) DEFAULT NULL COMMENT '儿童年龄段（冗余字段）',
  `report_type` ENUM('initial', 'followup', 'monthly') DEFAULT 'initial' COMMENT '报告类型',
  `overall_score` INT DEFAULT 0 COMMENT '综合评分(0-100)',
  `overall_percentile` INT DEFAULT NULL COMMENT '综合百分位排名',
  `overall_rating` VARCHAR(32) DEFAULT NULL COMMENT '综合评级：超越卓越/良好发展/普通范围/需要关注/建议专业评估',
  `dimension_scores` JSON DEFAULT NULL COMMENT '各维度评分JSON',
  `dimension_percentiles` JSON DEFAULT NULL COMMENT '各维度百分位JSON',
  `dimension_details` JSON DEFAULT NULL COMMENT '各维度详情JSON（分析和建议）',
  `strengths` JSON DEFAULT NULL COMMENT '优势领域JSON数组',
  `weaknesses` JSON DEFAULT NULL COMMENT '需提升领域JSON数组',
  `summary` TEXT COMMENT '综合摘要',
  `recommendations` JSON DEFAULT NULL COMMENT '训练建议JSON数组',
  `training_plan` JSON DEFAULT NULL COMMENT '训练计划JSON',
  `disclaimer` TEXT COMMENT 'ADHD合规免责声明',
  `pdf_url` VARCHAR(255) DEFAULT NULL COMMENT 'PDF文件URL',
  `generated_by` ENUM('system', 'ai') DEFAULT 'system' COMMENT '生成方式：system-系统, ai-AI生成',
  `is_read` TINYINT DEFAULT 0 COMMENT '是否已读：0-未读, 1-已读',
  `read_at` DATETIME DEFAULT NULL COMMENT '阅读时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`assessment_id`) REFERENCES `assessment`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`child_id`) REFERENCES `child`(`id`) ON DELETE CASCADE,
  INDEX `idx_child_id` (`child_id`),
  INDEX `idx_report_no` (`report_no`),
  INDEX `idx_report_type` (`report_type`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='测评报告表';

-- ----------------------------
-- 7. 游戏难度配置表 (game_difficulty_config)
-- ----------------------------
DROP TABLE IF EXISTS `game_difficulty_config`;
CREATE TABLE `game_difficulty_config` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  `game_id` INT UNSIGNED NOT NULL COMMENT '游戏ID',
  `game_code` VARCHAR(32) NOT NULL COMMENT '游戏代码',
  `age_group` VARCHAR(10) NOT NULL COMMENT '年龄组：4-5, 6-7, 8-9, 10-12',
  `difficulty_level` TINYINT DEFAULT 1 COMMENT '难度级别(1-5)',
  `parameters` JSON NOT NULL COMMENT '难度参数JSON',
  `time_limit` INT DEFAULT 0 COMMENT '时间限制(秒)',
  `pass_threshold` INT DEFAULT 0 COMMENT '通过阈值分数',
  `description` VARCHAR(255) DEFAULT NULL COMMENT '难度描述',
  `recommended_for` VARCHAR(255) DEFAULT NULL COMMENT '推荐人群描述',
  `is_default` TINYINT DEFAULT 0 COMMENT '是否默认：0-否, 1-是',
  `is_assessment` TINYINT DEFAULT 1 COMMENT '是否用于测评：0-否, 1-是',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`game_id`) REFERENCES `game`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_game_age_level` (`game_id`, `age_group`, `difficulty_level`),
  INDEX `idx_age_group` (`age_group`),
  INDEX `idx_game_code` (`game_code`),
  INDEX `idx_is_assessment` (`is_assessment`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏难度配置表';

-- ============================================
-- 初始化数据
-- ============================================

-- ----------------------------
-- 插入测评题目（幼儿组 4-5岁）
-- ----------------------------
INSERT INTO `assessment_question` (`question_code`, `dimension`, `dimension_name`, `question_type`, `question_early`, `options_early`, `weight`, `sort_order`) VALUES
-- 持续注意力
('Q_E_001', 'sustained_attention', '持续注意力', 'single_choice', '孩子是否能安静坐着听故事超过5分钟？', '[{"value":1,"label":"完全不行","score":2},{"value":2,"label":"偶尔可以","score":4},{"value":3,"label":"经常可以","score":6}]', 1.0, 1),
('Q_E_002', 'sustained_attention', '持续注意力', 'single_choice', '孩子玩玩具时能持续专注多久？', '[{"value":1,"label":"1-2分钟","score":2},{"value":2,"label":"3-5分钟","score":4},{"value":3,"label":"5-10分钟","score":6}]', 1.0, 2),
('Q_E_003', 'sustained_attention', '持续注意力', 'single_choice', '孩子看动画片时能保持安静不乱动吗？', '[{"value":1,"label":"完全不行","score":2},{"value":2,"label":"偶尔可以","score":4},{"value":3,"label":"经常可以","score":6}]', 1.0, 3),

-- 选择性注意力
('Q_E_004', 'selective_attention', '选择性注意力', 'single_choice', '能在嘈杂环境中找到自己的玩具吗？', '[{"value":1,"label":"很难找到","score":2},{"value":2,"label":"偶尔能找到","score":4}]', 1.0, 4),
('Q_E_005', 'selective_attention', '选择性注意力', 'single_choice', '能从一堆东西里找出想要的物品吗？', '[{"value":1,"label":"很难找到","score":2},{"value":2,"label":"偶尔能找到","score":4}]', 1.0, 5),
('Q_E_006', 'selective_attention', '选择性注意力', 'single_choice', '在多人说话时能听清家长说的话吗？', '[{"value":1,"label":"完全听不清","score":2},{"value":2,"label":"偶尔能","score":4},{"value":3,"label":"经常能","score":6}]', 1.0, 6),

-- 工作记忆
('Q_E_007', 'working_memory', '工作记忆', 'single_choice', '能记住简短的指令吗（如：去拿杯子然后回来）？', '[{"value":1,"label":"记不住","score":2},{"value":2,"label":"偶尔记住","score":4},{"value":3,"label":"经常记住","score":6}]', 1.0, 7),
('Q_E_008', 'working_memory', '工作记忆', 'single_choice', '能记住2-3样东西的位置吗？', '[{"value":1,"label":"记不住","score":2},{"value":2,"label":"偶尔记住","score":4},{"value":3,"label":"经常记住","score":6}]', 1.0, 8),
('Q_E_009', 'working_memory', '工作记忆', 'single_choice', '能说出刚才看过的图片里有哪些东西吗？', '[{"value":1,"label":"说不出","score":2},{"value":2,"label":"偶尔能","score":4},{"value":3,"label":"经常能","score":6}]', 1.0, 9),

-- 冲动控制
('Q_E_010', 'impulse_control', '冲动控制', 'single_choice', '被要求等待时能等多久？', '[{"value":1,"label":"完全不能等","score":1},{"value":2,"label":"等1-2分钟","score":3},{"value":3,"label":"等3-5分钟","score":5},{"value":4,"label":"能等待更久","score":7}]', 1.0, 10),
('Q_E_011', 'impulse_control', '冲动控制', 'single_choice', '能等待轮流玩玩具吗？', '[{"value":1,"label":"完全不能","score":2},{"value":2,"label":"偶尔可以","score":4},{"value":3,"label":"经常可以","score":6}]', 1.0, 11),
('Q_E_012', 'impulse_control', '冲动控制', 'single_choice', '家长说话时孩子会打断吗？', '[{"value":1,"label":"经常打断","score":2},{"value":2,"label":"偶尔打断","score":4},{"value":3,"label":"很少打断","score":6}]', 1.0, 12),

-- 转移注意力
('Q_E_013', 'attention_shifting', '转移注意力', 'single_choice', '能在不同活动之间切换而不哭闹吗？', '[{"value":1,"label":"完全不能","score":2},{"value":2,"label":"偶尔可以","score":4},{"value":3,"label":"经常可以","score":6}]', 1.0, 13),
('Q_E_014', 'attention_shifting', '转移注意力', 'single_choice', '能适应新环境或陌生人吗？', '[{"value":1,"label":"很难适应","score":2},{"value":2,"label":"需要时间","score":4},{"value":3,"label":"很快适应","score":6}]', 1.0, 14);

-- ----------------------------
-- 插入测评题目（学前期 6-7岁）
-- ----------------------------
INSERT INTO `assessment_question` (`question_code`, `dimension`, `dimension_name`, `question_type`, `question_mid`, `options_mid`, `weight`, `sort_order`) VALUES
-- 持续注意力
('Q_M_001', 'sustained_attention', '持续注意力', 'single_choice', '做作业或玩游戏时能坚持多久不分心？', '[{"value":1,"label":"1-5分钟","score":2},{"value":2,"label":"5-10分钟","score":4},{"value":3,"label":"10-20分钟","score":6},{"value":4,"label":"超过20分钟","score":8}]', 1.0, 15),
('Q_M_002', 'sustained_attention', '持续注意力', 'single_choice', '能看完一整集动画片吗（约25分钟）？', '[{"value":1,"label":"完全不行","score":2},{"value":2,"label":"可以看完","score":6}]', 1.0, 16),
('Q_M_003', 'sustained_attention', '持续注意力', 'single_choice', '上课或学习时能保持坐姿吗？', '[{"value":1,"label":"完全不行","score":2},{"value":2,"label":"偶尔可以","score":4},{"value":3,"label":"经常可以","score":6},{"value":4,"label":"一直可以","score":8}]', 1.0, 17),

-- 选择性注意力
('Q_M_004', 'selective_attention', '选择性注意力', 'single_choice', '在有干扰的环境中能完成任务吗？', '[{"value":1,"label":"完全不能","score":2},{"value":2,"label":"偶尔能","score":4},{"value":3,"label":"经常能","score":6},{"value":4,"label":"完全能","score":8}]', 1.0, 18),
('Q_M_005', 'selective_attention', '选择性注意力', 'single_choice', '能从复杂图形中找到特定图案吗？', '[{"value":1,"label":"很难找到","score":2},{"value":2,"label":"偶尔能找到","score":4},{"value":3,"label":"经常能找到","score":6}]', 1.0, 19),

-- 工作记忆
('Q_M_006', 'working_memory', '工作记忆', 'single_choice', '能记住3-4步的指令吗？', '[{"value":1,"label":"记不住","score":2},{"value":2,"label":"偶尔记住","score":4},{"value":3,"label":"经常记住","score":6}]', 1.0, 20),
('Q_M_007', 'working_memory', '工作记忆', 'single_choice', '能在心里做简单的心算吗（如3+2）？', '[{"value":1,"label":"完全不能","score":2},{"value":2,"label":"偶尔能","score":4},{"value":3,"label":"经常能","score":6}]', 1.0, 21),

-- 冲动控制
('Q_M_008', 'impulse_control', '冲动控制', 'single_choice', '说话前会思考吗？', '[{"value":1,"label":"完全不会","score":2},{"value":2,"label":"偶尔会","score":4},{"value":3,"label":"经常会","score":6},{"value":4,"label":"总是会","score":8}]', 1.0, 22),
('Q_M_009', 'impulse_control', '冲动控制', 'single_choice', '能等待并忍耐吗（如等待零食）？', '[{"value":1,"label":"完全不能","score":2},{"value":2,"label":"偶尔能","score":4},{"value":3,"label":"经常能","score":6},{"value":4,"label":"完全能","score":8}]', 1.0, 23),

-- 转移注意力
('Q_M_010', 'attention_shifting', '转移注意力', 'single_choice', '能从一件事快速转到另一件事吗？', '[{"value":1,"label":"很困难","score":2},{"value":2,"label":"需要时间","score":4},{"value":3,"label":"比较快","score":6},{"value":4,"label":"很快","score":8}]', 1.0, 24),
('Q_M_011', 'attention_shifting', '转移注意力', 'single_choice', '被打断后能重新专注吗？', '[{"value":1,"label":"很难","score":2},{"value":2,"label":"需要时间","score":4},{"value":3,"label":"比较快","score":6}]', 1.0, 25),

-- 分配注意力
('Q_M_012', 'divided_attention', '分配注意力', 'single_choice', '能同时听指令并做动作吗？', '[{"value":1,"label":"完全不能","score":2},{"value":2,"label":"偶尔能","score":4},{"value":3,"label":"经常能","score":6}]', 1.0, 26),
('Q_M_013', 'divided_attention', '分配注意力', 'single_choice', '上课时能一边听一边看着老师吗？', '[{"value":1,"label":"完全不能","score":2},{"value":2,"label":"偶尔能","score":4},{"value":3,"label":"经常能","score":6}]', 1.0, 27),

-- 反应速度
('Q_M_014', 'reaction_speed', '反应速度', 'single_choice', '对问题的反应速度如何？', '[{"value":1,"label":"很慢","score":2},{"value":2,"label":"中等","score":4},{"value":3,"label":"较快","score":6}]', 1.0, 28),
('Q_M_015', 'reaction_speed', '反应速度', 'single_choice', '运动时的反应敏捷吗？', '[{"value":1,"label":"很慢","score":2},{"value":2,"label":"中等","score":4},{"value":3,"label":"较快","score":6}]', 1.0, 29),

-- 综合评估
('Q_M_016', 'sustained_attention', '综合评估', 'single_choice', '容易粗心犯错吗？', '[{"value":1,"label":"经常","score":2},{"value":2,"label":"偶尔","score":4},{"value":3,"label":"很少","score":6}]', 0.8, 30),
('Q_M_017', 'working_memory', '综合评估', 'single_choice', '经常丢三落四吗？', '[{"value":1,"label":"经常","score":2},{"value":2,"label":"偶尔","score":4},{"value":3,"label":"很少","score":6}]', 0.8, 31),

-- 补充题目（幼儿组 4-5岁）- 目标：14题 -> 20题
-- 分配注意力
('Q_E_015', 'divided_attention', '分配注意力', 'single_choice', '能一边听歌一边玩玩具吗？', '[{"value":1,"label":"完全不能","score":2},{"value":2,"label":"偶尔可以","score":4},{"value":3,"label":"经常可以","score":6}]', 1.0, 51),
('Q_E_016', 'divided_attention', '分配注意力', 'single_choice', '能在说话时看着对方吗？', '[{"value":1,"label":"很难","score":2},{"value":2,"label":"偶尔能","score":4},{"value":3,"label":"经常能","score":6}]', 1.0, 52),
-- 反应速度
('Q_E_017', 'reaction_speed', '反应速度', 'single_choice', '对感兴趣的事反应快吗？', '[{"value":1,"label":"很慢","score":2},{"value":2,"label":"一般","score":4},{"value":3,"label":"很快","score":6}]', 1.0, 53),
('Q_E_018', 'reaction_speed', '反应速度', 'single_choice', '对名字的反应速度如何？', '[{"value":1,"label":"没反应","score":2},{"value":2,"label":"有时反应","score":4},{"value":3,"label":"很快反应","score":6}]', 1.0, 54),
-- 持续注意力
('Q_E_019', 'sustained_attention', '持续注意力', 'single_choice', '玩拼图能坚持多久？', '[{"value":1,"label":"1分钟以内","score":2},{"value":2,"label":"1-3分钟","score":4},{"value":3,"label":"3-5分钟","score":6}]', 1.0, 55),
('Q_E_020', 'sustained_attention', '持续注意力', 'single_choice', '能安静坐着画画多久？', '[{"value":1,"label":"1分钟","score":2},{"value":2,"label":"2-3分钟","score":4},{"value":3,"label":"5分钟以上","score":6}]', 1.0, 56),

-- 补充题目（学前期 6-7岁）- 目标：17题 -> 28题
-- 持续注意力
('Q_M_018', 'sustained_attention', '持续注意力', 'single_choice', '能专注玩游戏多久？', '[{"value":1,"label":"5分钟","score":2},{"value":2,"label":"10分钟","score":4},{"value":3,"label":"20分钟","score":6},{"value":4,"label":"30分钟","score":8}]', 1.0, 57),
('Q_M_019', 'sustained_attention', '持续注意力', 'single_choice', '上课时眼神能跟随老师吗？', '[{"value":1,"label":"完全不行","score":2},{"value":2,"label":"偶尔可以","score":4},{"value":3,"label":"经常可以","score":6}]', 1.0, 58),
-- 选择性注意力
('Q_M_020', 'selective_attention', '选择性注意力', 'single_choice', '做作业时电视开着会影响吗？', '[{"value":1,"label":"完全不能做","score":2},{"value":2,"label":"偶尔分心","score":4},{"value":3,"label":"不影响","score":6}]', 1.0, 59),
('Q_M_021', 'selective_attention', '选择性注意力', 'single_choice', '能从复杂图案中找到目标吗？', '[{"value":1,"label":"很难找到","score":2},{"value":2,"label":"需要时间","score":4},{"value":3,"label":"很快找到","score":6}]', 1.0, 60),
('Q_M_022', 'selective_attention', '选择性注意力', 'single_choice', '嘈杂环境能找到自己的东西吗？', '[{"value":1,"label":"完全不能","score":2},{"value":2,"label":"偶尔能","score":4},{"value":3,"label":"经常能","score":6}]', 1.0, 61),
-- 工作记忆
('Q_M_023', 'working_memory', '工作记忆', 'single_choice', '能记住要买的几样东西吗？', '[{"value":1,"label":"记不住","score":2},{"value":2,"label":"记得1-2样","score":4},{"value":3,"label":"全记得","score":6}]', 1.0, 62),
('Q_M_024', 'working_memory', '工作记忆', 'single_choice', '能记住刚才读的故事内容吗？', '[{"value":1,"label":"完全不能","score":2},{"value":2,"label":"记得一点","score":4},{"value":3,"label":"记得很多","score":6}]', 1.0, 63),
-- 冲动控制
('Q_M_025', 'impulse_control', '冲动控制', 'single_choice', '想要东西时会马上要吗？', '[{"value":1,"label":"必须马上有","score":2},{"value":2,"label":"需要等一下","score":4},{"value":3,"label":"能等待","score":6}]', 1.0, 64),
('Q_M_026', 'impulse_control', '冲动控制', 'single_choice', '会冲动做危险的事吗？', '[{"value":1,"label":"经常","score":2},{"value":2,"label":"偶尔","score":4},{"value":3,"label":"很少","score":6}]', 1.0, 65),
-- 转移注意力
('Q_M_027', 'attention_shifting', '转移注意力', 'single_choice', '换活动时需要大人提醒吗？', '[{"value":1,"label":"经常需要","score":2},{"value":2,"label":"偶尔需要","score":4},{"value":3,"label":"不需要","score":6}]', 1.0, 66),
('Q_M_028', 'attention_shifting', '转移注意力', 'single_choice', '能从一件事转到另一件事吗？', '[{"value":1,"label":"很慢","score":2},{"value":2,"label":"需要几分钟","score":4},{"value":3,"label":"很快","score":6}]', 1.0, 67),
-- 分配注意力
('Q_M_029', 'divided_attention', '分配注意力', 'single_choice', '能一边听一边做动作吗？', '[{"value":1,"label":"完全不能","score":2},{"value":2,"label":"偶尔能","score":4},{"value":3,"label":"经常能","score":6}]', 1.0, 68),
('Q_M_030', 'divided_attention', '分配注意力', 'single_choice', '上课时能边听边记吗？', '[{"value":1,"label":"做不好","score":2},{"value":2,"label":"偶尔可以","score":4},{"value":3,"label":"做得很好","score":6}]', 1.0, 69),
-- 反应速度
('Q_M_031', 'reaction_speed', '反应速度', 'single_choice', '玩游戏反应敏捷吗？', '[{"value":1,"label":"很慢","score":2},{"value":2,"label":"一般","score":4},{"value":3,"label":"很快","score":6}]', 1.0, 70),
('Q_M_032', 'reaction_speed', '反应速度', 'single_choice', '回答问题时反应快吗？', '[{"value":1,"label":"需要很久","score":2},{"value":2,"label":"一般","score":4},{"value":3,"label":"很快","score":6}]', 1.0, 71),

-- 补充题目（小学低年级 8-9岁）- 目标：19题 -> 28题
-- 持续注意力
('Q_L_020', 'sustained_attention', '持续注意力', 'single_choice', '看书能看多久不玩？', '[{"value":1,"label":"5分钟","score":2},{"value":2,"label":"15分钟","score":4},{"value":3,"label":"30分钟","score":6}]', 1.0, 72),
('Q_L_021', 'sustained_attention', '持续注意力', 'single_choice', '能独立完成作业吗？', '[{"value":1,"label":"完全不能","score":2},{"value":2,"label":"需要监督","score":4},{"value":3,"label":"完全独立","score":6}]', 1.0, 73),
-- 选择性注意力
('Q_L_022', 'selective_attention', '选择性注意力', 'single_choice', '能从复杂信息中找到重点吗？', '[{"value":1,"label":"经常找错","score":2},{"value":2,"label":"需要时间","score":4},{"value":3,"label":"很容易","score":6}]', 1.0, 74),
('Q_L_023', 'selective_attention', '选择性注意力', 'single_choice', '多人对话中能专注听吗？', '[{"value":1,"label":"经常走神","score":2},{"value":2,"label":"需要努力","score":4},{"value":3,"label":"完全能","score":6}]', 1.0, 75),
('Q_L_024', 'selective_attention', '选择性注意力', 'single_choice', '嘈杂环境学习效率如何？', '[{"value":1,"label":"很低","score":2},{"value":2,"label":"一般","score":4},{"value":3,"label":"很高","score":6}]', 1.0, 76),
-- 工作记忆
('Q_L_025', 'working_memory', '工作记忆', 'single_choice', '能记住要买的几样东西吗？', '[{"value":1,"label":"经常忘记","score":2},{"value":2,"label":"记得一些","score":4},{"value":3,"label":"完全记得","score":6}]', 1.0, 77),
('Q_L_026', 'working_memory', '工作记忆', 'single_choice', '复杂心算能力如何？', '[{"value":1,"label":"很困难","score":2},{"value":2,"label":"需要时间","score":4},{"value":3,"label":"很轻松","score":6}]', 1.0, 78),
('Q_L_027', 'working_memory', '工作记忆', 'single_choice', '能在脑中同时处理多件事吗？', '[{"value":1,"label":"经常混乱","score":2},{"value":2,"label":"需要努力","score":4},{"value":3,"label":"轻松处理","score":6}]', 1.0, 79),
-- 冲动控制
('Q_L_028', 'impulse_control', '冲动控制', 'single_choice', '情绪激动时能控制言行吗？', '[{"value":1,"label":"很难控制","score":2},{"value":2,"label":"有时能","score":4},{"value":3,"label":"基本能","score":6}]', 1.0, 80),
('Q_L_029', 'impulse_control', '冲动控制', 'single_choice', '会因为冲动做后悔的事吗？', '[{"value":1,"label":"经常","score":2},{"value":2,"label":"偶尔","score":4},{"value":3,"label":"很少","score":6}]', 1.0, 81),
('Q_L_030', 'impulse_control', '冲动控制', 'single_choice', '重要场合能控制表现吗？', '[{"value":1,"label":"很难","score":2},{"value":2,"label":"需要努力","score":4},{"value":3,"label":"完全能","score":6}]', 1.0, 82),
-- 转移注意力
('Q_L_031', 'attention_shifting', '转移注意力', 'single_choice', '遇到困难能调整策略吗？', '[{"value":1,"label":"很难","score":2},{"value":2,"label":"需要帮助","score":4},{"value":3,"label":"很容易","score":6}]', 1.0, 83),
('Q_L_032', 'attention_shifting', '转移注意力', 'single_choice', '任务切换效率如何？', '[{"value":1,"label":"很低","score":2},{"value":2,"label":"一般","score":4},{"value":3,"label":"很高","score":6}]', 1.0, 84),
-- 分配注意力
('Q_L_033', 'divided_attention', '分配注意力', 'single_choice', '能同时处理多件事吗？', '[{"value":1,"label":"经常忘记","score":2},{"value":2,"label":"偶尔记得","score":4},{"value":3,"label":"轻松处理","score":6}]', 1.0, 85),
('Q_L_034', 'divided_attention', '分配注意力', 'single_choice', '一边听讲一边做笔记能力？', '[{"value":1,"label":"完全不行","score":2},{"value":2,"label":"有时可以","score":4},{"value":3,"label":"很熟练","score":6}]', 1.0, 86),
-- 反应速度
('Q_L_035', 'reaction_speed', '反应速度', 'single_choice', '限时任务能按时完成吗？', '[{"value":1,"label":"总是超时","score":2},{"value":2,"label":"刚好完成","score":4},{"value":3,"label":"提前完成","score":6}]', 1.0, 87),
('Q_L_036', 'reaction_speed', 'reaction_speed', 'single_choice', '面对突发情况反应快吗？', '[{"value":1,"label":"很慢","score":2},{"value":2,"label":"一般","score":4},{"value":3,"label":"很快","score":6}]', 1.0, 88),
('Q_L_037', 'reaction_speed', 'reaction_speed', 'single_choice', '竞技活动反应敏捷吗？', '[{"value":1,"label":"很慢","score":2},{"value":2,"label":"一般","score":4},{"value":3,"label":"很快","score":6}]', 1.0, 89),
-- 综合评估
('Q_L_038', 'divided_attention', '综合评估', 'single_choice', '能在多任务时保持效率吗？', '[{"value":1,"label":"很低","score":2},{"value":2,"label":"一般","score":4},{"value":3,"label":"很高","score":6}]', 0.8, 90),
('Q_L_039', 'attention_shifting', '综合评估', 'single_choice', '多任务处理效率如何？', '[{"value":1,"label":"经常出错","score":2},{"value":2,"label":"有时能应付","score":4},{"value":3,"label":"很高效","score":6}]', 0.8, 91);

-- ----------------------------
-- 插入测评题目（小学低年级 8-9岁）
-- ----------------------------
INSERT INTO `assessment_question` (`question_code`, `dimension`, `dimension_name`, `question_type`, `question_late`, `options_late`, `weight`, `sort_order`) VALUES
-- 持续注意力
('Q_L_001', 'sustained_attention', '持续注意力', 'single_choice', '课堂40分钟能保持专注吗？', '[{"value":1,"label":"只能5分钟","score":2},{"value":2,"label":"10-15分钟","score":4},{"value":3,"label":"20-30分钟","score":6},{"value":4,"label":"全程专注","score":8}]', 1.0, 32),
('Q_L_002', 'sustained_attention', '持续注意力', 'single_choice', '做作业时能坚持多久不分心？', '[{"value":1,"label":"5分钟以内","score":2},{"value":2,"label":"5-10分钟","score":4},{"value":3,"label":"15-20分钟","score":6},{"value":4,"label":"超过20分钟","score":8}]', 1.0, 33),

-- 选择性注意力
('Q_L_003', 'selective_attention', '选择性注意力', 'single_choice', '能忽略无关干扰吗？', '[{"value":1,"label":"完全不能","score":2},{"value":2,"label":"偶尔能","score":4},{"value":3,"label":"经常能","score":6},{"value":4,"label":"完全能","score":8},{"value":5,"label":"很容易","score":10}]', 1.0, 34),
('Q_L_004', 'selective_attention', '选择性注意力', 'single_choice', '在多人环境中能专注吗？', '[{"value":1,"label":"完全不能","score":2},{"value":2,"label":"偶尔能","score":4},{"value":3,"label":"经常能","score":6},{"value":4,"label":"完全能","score":8}]', 1.0, 35),

-- 工作记忆
('Q_L_005', 'working_memory', '工作记忆', 'single_choice', '心算能力如何（20以内加减）？', '[{"value":1,"label":"很困难","score":2},{"value":2,"label":"需要时间","score":4},{"value":3,"label":"一般","score":6},{"value":4,"label":"较好","score":8}]', 1.0, 36),
('Q_L_006', 'working_memory', '工作记忆', 'single_choice', '能记住多步骤指令并执行吗？', '[{"value":1,"label":"记不住步骤","score":2},{"value":2,"label":"需要提醒","score":4},{"value":3,"label":"基本能记住","score":6},{"value":4,"label":"完全能记住","score":8}]', 1.0, 37),

-- 冲动控制
('Q_L_007', 'impulse_control', '冲动控制', 'single_choice', '会冲动说错话或做错事吗？', '[{"value":1,"label":"经常","score":2},{"value":2,"label":"偶尔","score":4},{"value":3,"label":"很少","score":6},{"value":4,"label":"几乎不会","score":8},{"value":5,"label":"从不","score":10}]', 1.0, 38),
('Q_L_008', 'impulse_control', '冲动控制', 'single_choice', '考试时能检查答案吗？', '[{"value":1,"label":"完全不能","score":2},{"value":2,"label":"偶尔","score":4},{"value":3,"label":"经常","score":6},{"value":4,"label":"总是","score":8}]', 1.0, 39),

-- 转移注意力
('Q_L_009', 'attention_shifting', '转移注意力', 'single_choice', '能快速切换不同科目学习吗？', '[{"value":1,"label":"很困难","score":2},{"value":2,"label":"需要时间","score":4},{"value":3,"label":"比较快","score":6},{"value":4,"label":"很快","score":8}]', 1.0, 40),
('Q_L_010', 'attention_shifting', '转移注意力', 'single_choice', '被打断后多久能恢复专注？', '[{"value":1,"label":"很久恢复不了","score":2},{"value":2,"label":"需要5分钟","score":4},{"value":3,"label":"1-2分钟","score":6},{"value":4,"label":"很快恢复","score":8}]', 1.0, 41),

-- 分配注意力
('Q_L_011', 'divided_attention', '分配注意力', 'single_choice', '能边听边记笔记吗？', '[{"value":1,"label":"完全不能","score":2},{"value":2,"label":"偶尔能","score":4},{"value":3,"label":"经常能","score":6},{"value":4,"label":"完全能","score":8}]', 1.0, 42),
('Q_L_012', 'divided_attention', '分配注意力', 'single_choice', '多任务处理时效率如何？', '[{"value":1,"label":"很低","score":2},{"value":2,"label":"较低","score":4},{"value":3,"label":"一般","score":6},{"value":4,"label":"较高","score":8}]', 1.0, 43),

-- 反应速度
('Q_L_013', 'reaction_speed', '反应速度', 'single_choice', '考试时答题速度快吗？', '[{"value":1,"label":"很慢，总做不完","score":2},{"value":2,"label":"较慢","score":4},{"value":3,"label":"正常","score":6},{"value":4,"label":"较快","score":8}]', 1.0, 44),
('Q_L_014', 'reaction_speed', '反应速度', 'single_choice', '运动反应敏捷吗？', '[{"value":1,"label":"很慢","score":2},{"value":2,"label":"较慢","score":4},{"value":3,"label":"正常","score":6},{"value":4,"label":"很快","score":8}]', 1.0, 45),

-- 综合评估
('Q_L_015', 'sustained_attention', '综合评估', 'single_choice', '作业经常因为粗心出错吗？', '[{"value":1,"label":"经常","score":2},{"value":2,"label":"偶尔","score":4},{"value":3,"label":"很少","score":6},{"value":4,"label":"几乎不会","score":8}]', 0.8, 46),
('Q_L_016', 'working_memory', '综合评估', 'single_choice', '经常丢失物品吗？', '[{"value":1,"label":"经常","score":2},{"value":2,"label":"偶尔","score":4},{"value":3,"label":"很少","score":6}]', 0.8, 47),
('Q_L_017', 'attention_shifting', '综合评估', 'single_choice', '做事有计划性吗？', '[{"value":1,"label":"完全没有","score":2},{"value":2,"label":"偶尔有","score":4},{"value":3,"label":"经常有","score":6},{"value":4,"label":"很有计划","score":8}]', 0.8, 48),
('Q_L_018', 'sustained_attention', '综合评估', 'single_choice', '能独立完成作业吗？', '[{"value":1,"label":"完全不能","score":2},{"value":2,"label":"需要很多帮助","score":4},{"value":3,"label":"偶尔需要","score":6},{"value":4,"label":"完全独立","score":8}]', 0.8, 49),
('Q_L_019', 'impulse_control', '综合评估', 'single_choice', '对新任务有畏难情绪吗？', '[{"value":1,"label":"总是逃避","score":2},{"value":2,"label":"经常逃避","score":4},{"value":3,"label":"偶尔","score":6},{"value":4,"label":"很少","score":8}]', 0.8, 50);

-- ----------------------------
-- 插入百分位常模数据
-- ----------------------------
INSERT INTO `percentile_norm` (`dimension`, `dimension_name`, `age_group`, `age_min`, `age_max`, `sample_size`, `mean`, `std_dev`, `p10`, `p30`, `p50`, `p70`, `p90`) VALUES
-- 幼儿组（4-5岁）
('sustained_attention', '持续注意力', '4-5', 4, 5, 500, 65.0, 15.0, 47.0, 57.0, 65.0, 73.0, 84.0),
('selective_attention', '选择性注意力', '4-5', 4, 5, 500, 60.0, 14.0, 42.0, 53.0, 60.0, 67.0, 78.0),
('working_memory', '工作记忆', '4-5', 4, 5, 500, 55.0, 12.0, 41.0, 49.0, 55.0, 61.0, 70.0),
('impulse_control', '冲动控制', '4-5', 4, 5, 500, 58.0, 13.0, 42.0, 51.0, 58.0, 65.0, 75.0),
('attention_shifting', '转移注意力', '4-5', 4, 5, 500, 55.0, 12.0, 40.0, 49.0, 55.0, 61.0, 70.0),
('divided_attention', '分配注意力', '4-5', 4, 5, 500, 50.0, 10.0, 38.0, 45.0, 50.0, 55.0, 63.0),
('reaction_speed', '反应速度', '4-5', 4, 5, 500, 55.0, 12.0, 41.0, 49.0, 55.0, 61.0, 70.0),

-- 学前期（6-7岁）
('sustained_attention', '持续注意力', '6-7', 6, 7, 800, 70.0, 14.0, 52.0, 63.0, 70.0, 77.0, 88.0),
('selective_attention', '选择性注意力', '6-7', 6, 7, 800, 65.0, 13.0, 49.0, 58.0, 65.0, 72.0, 82.0),
('working_memory', '工作记忆', '6-7', 6, 7, 800, 62.0, 11.0, 48.0, 56.0, 62.0, 68.0, 76.0),
('impulse_control', '冲动控制', '6-7', 6, 7, 800, 63.0, 12.0, 48.0, 57.0, 63.0, 69.0, 78.0),
('attention_shifting', '转移注意力', '6-7', 6, 7, 800, 60.0, 11.0, 46.0, 54.0, 60.0, 66.0, 74.0),
('divided_attention', '分配注意力', '6-7', 6, 7, 800, 55.0, 10.0, 43.0, 50.0, 55.0, 60.0, 68.0),
('reaction_speed', '反应速度', '6-7', 6, 7, 800, 60.0, 11.0, 46.0, 54.0, 60.0, 66.0, 74.0),

-- 小学低年级（8-9岁）
('sustained_attention', '持续注意力', '8-9', 8, 9, 1000, 75.0, 12.0, 60.0, 69.0, 75.0, 81.0, 90.0),
('selective_attention', '选择性注意力', '8-9', 8, 9, 1000, 70.0, 12.0, 55.0, 64.0, 70.0, 76.0, 85.0),
('working_memory', '工作记忆', '8-9', 8, 9, 1000, 68.0, 10.0, 55.0, 62.0, 68.0, 74.0, 81.0),
('impulse_control', '冲动控制', '8-9', 8, 9, 1000, 68.0, 11.0, 54.0, 62.0, 68.0, 74.0, 82.0),
('attention_shifting', '转移注意力', '8-9', 8, 9, 1000, 65.0, 10.0, 52.0, 60.0, 65.0, 70.0, 78.0),
('divided_attention', '分配注意力', '8-9', 8, 9, 1000, 60.0, 10.0, 48.0, 55.0, 60.0, 65.0, 73.0),
('reaction_speed', '反应速度', '8-9', 8, 9, 1000, 65.0, 10.0, 52.0, 60.0, 65.0, 70.0, 78.0),

-- 小学高年级（10-12岁）
('sustained_attention', '持续注意力', '10-12', 10, 12, 1200, 78.0, 10.0, 65.0, 73.0, 78.0, 83.0, 91.0),
('selective_attention', '选择性注意力', '10-12', 10, 12, 1200, 73.0, 11.0, 59.0, 67.0, 73.0, 79.0, 87.0),
('working_memory', '工作记忆', '10-12', 10, 12, 1200, 72.0, 10.0, 59.0, 67.0, 72.0, 77.0, 85.0),
('impulse_control', '冲动控制', '10-12', 10, 12, 1200, 72.0, 10.0, 59.0, 67.0, 72.0, 77.0, 85.0),
('attention_shifting', '转移注意力', '10-12', 10, 12, 1200, 70.0, 10.0, 57.0, 65.0, 70.0, 75.0, 83.0),
('divided_attention', '分配注意力', '10-12', 10, 12, 1200, 65.0, 10.0, 52.0, 60.0, 65.0, 70.0, 78.0),
('reaction_speed', '反应速度', '10-12', 10, 12, 1200, 70.0, 10.0, 57.0, 65.0, 70.0, 75.0, 83.0);

-- ----------------------------
-- 插入游戏难度配置
-- ----------------------------
INSERT INTO `game_difficulty_config` (`game_id`, `game_code`, `age_group`, `difficulty_level`, `parameters`, `time_limit`, `pass_threshold`, `description`, `is_default`, `is_assessment`) VALUES
-- 舒尔特方格
(1, 'schulte', '4-5', 1, '{"grid_size": 3, "show_number_hints": true, "enable_sound": true}', 60, 50, '3×3方格，带数字提示', 1, 1),
(1, 'schulte', '6-7', 1, '{"grid_size": 4, "show_number_hints": true, "enable_sound": true}', 90, 50, '4×4方格，带数字提示', 1, 1),
(1, 'schulte', '6-7', 2, '{"grid_size": 4, "show_number_hints": false, "enable_sound": true}', 90, 45, '4×4方格，无提示', 0, 1),
(1, 'schulte', '8-9', 1, '{"grid_size": 5, "show_number_hints": true, "enable_sound": true}', 120, 50, '5×5方格，带数字提示', 1, 1),
(1, 'schulte', '8-9', 2, '{"grid_size": 5, "show_number_hints": false, "enable_sound": true}', 120, 45, '5×5方格，无提示', 0, 1),
(1, 'schulte', '10-12', 1, '{"grid_size": 5, "show_number_hints": false, "enable_sound": true}', 120, 50, '5×5方格', 1, 1),
(1, 'schulte', '10-12', 2, '{"grid_size": 6, "show_number_hints": false, "enable_sound": true}', 150, 45, '6×6方格', 0, 1),

-- 听声辨数
(2, 'audio_count', '4-5', 1, '{"digit_count": 3, "play_interval": 1500, "speed": "slow", "has_repeat": false}', 90, 3, '3位数，慢速播放', 1, 1),
(2, 'audio_count', '6-7', 1, '{"digit_count": 4, "play_interval": 1200, "speed": "medium", "has_repeat": false}', 120, 3, '4位数，中速播放', 1, 1),
(2, 'audio_count', '6-7', 2, '{"digit_count": 5, "play_interval": 1000, "speed": "medium", "has_repeat": true}', 120, 3, '5位数，可重复', 0, 1),
(2, 'audio_count', '8-9', 1, '{"digit_count": 5, "play_interval": 1000, "speed": "medium", "has_repeat": false}', 120, 4, '5位数', 1, 1),
(2, 'audio_count', '8-9', 2, '{"digit_count": 7, "play_interval": 800, "speed": "fast", "has_repeat": false}', 150, 3, '7位数，快速', 0, 1),
(2, 'audio_count', '10-12', 1, '{"digit_count": 7, "play_interval": 800, "speed": "fast", "has_repeat": false}', 150, 4, '7位数', 1, 1),
(2, 'audio_count', '10-12', 2, '{"digit_count": 9, "play_interval": 600, "speed": "very_fast", "has_repeat": true}', 180, 3, '9位数，可重复', 0, 1),

-- 图案记忆
(3, 'pattern_memory', '4-5', 1, '{"pattern_count": 3, "display_time": 3000, "distractor_count": 2, "grid_size": 3}', 60, 3, '3个图案，3秒显示', 1, 1),
(3, 'pattern_memory', '6-7', 1, '{"pattern_count": 4, "display_time": 2000, "distractor_count": 3, "grid_size": 4}', 90, 3, '4个图案，2秒显示', 1, 1),
(3, 'pattern_memory', '6-7', 2, '{"pattern_count": 5, "display_time": 1500, "distractor_count": 3, "grid_size": 4}', 90, 3, '5个图案，1.5秒', 0, 1),
(3, 'pattern_memory', '8-9', 1, '{"pattern_count": 5, "display_time": 1500, "distractor_count": 4, "grid_size": 4}', 120, 4, '5个图案', 1, 1),
(3, 'pattern_memory', '8-9', 2, '{"pattern_count": 6, "display_time": 1000, "distractor_count": 4, "grid_size": 5}', 120, 3, '6个图案，1秒', 0, 1),
(3, 'pattern_memory', '10-12', 1, '{"pattern_count": 6, "display_time": 1000, "distractor_count": 5, "grid_size": 5}', 120, 4, '6个图案', 1, 1),
(3, 'pattern_memory', '10-12', 2, '{"pattern_count": 8, "display_time": 800, "distractor_count": 5, "grid_size": 6}', 150, 3, '8个图案', 0, 1),

-- 视觉追踪
(4, 'visual_tracking', '6-7', 1, '{"target_count": 1, "speed": "slow", "distractor_count": 2, "path_type": "linear"}', 60, 8, '1个目标，慢速', 1, 1),
(4, 'visual_tracking', '6-7', 2, '{"target_count": 2, "speed": "medium", "distractor_count": 3, "path_type": "linear"}', 90, 6, '2个目标，中速', 0, 1),
(4, 'visual_tracking', '8-9', 1, '{"target_count": 2, "speed": "medium", "distractor_count": 4, "path_type": "curved"}', 90, 8, '2个目标，曲线路径', 1, 1),
(4, 'visual_tracking', '8-9', 2, '{"target_count": 3, "speed": "medium_fast", "distractor_count": 5, "path_type": "mixed"}', 120, 6, '3个目标', 0, 1),
(4, 'visual_tracking', '10-12', 1, '{"target_count": 3, "speed": "medium_fast", "distractor_count": 5, "path_type": "mixed"}', 120, 8, '3个目标', 1, 1),
(4, 'visual_tracking', '10-12', 2, '{"target_count": 4, "speed": "fast", "distractor_count": 6, "path_type": "chaotic"}', 150, 6, '4个目标，高速', 0, 1),

-- 节奏点击
(5, 'rhythm_tap', '4-5', 1, '{"rhythm_type": "single", "bpm": 60, "duration": 30, "pattern": "simple"}', 45, 8, '单节奏，60BPM', 1, 1),
(5, 'rhythm_tap', '6-7', 1, '{"rhythm_type": "double", "bpm": 80, "duration": 45, "pattern": "simple"}', 60, 10, '2种节奏，80BPM', 1, 1),
(5, 'rhythm_tap', '6-7', 2, '{"rhythm_type": "triple", "bpm": 100, "duration": 45, "pattern": "mixed"}', 60, 8, '3种节奏，100BPM', 0, 1),
(5, 'rhythm_tap', '8-9', 1, '{"rhythm_type": "triple", "bpm": 100, "duration": 60, "pattern": "mixed"}', 90, 12, '3种节奏', 1, 1),
(5, 'rhythm_tap', '8-9', 2, '{"rhythm_type": "complex", "bpm": 120, "duration": 60, "pattern": "irregular"}', 90, 10, '复杂节奏', 0, 1),
(5, 'rhythm_tap', '10-12', 1, '{"rhythm_type": "complex", "bpm": 120, "duration": 90, "pattern": "irregular"}', 120, 15, '复杂节奏，120BPM', 1, 1),
(5, 'rhythm_tap', '10-12', 2, '{"rhythm_type": "expert", "bpm": 140, "duration": 90, "pattern": "mixed"}', 120, 12, '专家级节奏', 0, 1),

-- 听觉记忆
(6, 'auditory_memory', '4-5', 1, '{"digit_count": 3, "has_interference": false, "has_reverse": false, "play_interval": 1500}', 60, 3, '3位数字，无干扰', 1, 1),
(6, 'auditory_memory', '6-7', 1, '{"digit_count": 4, "has_interference": true, "has_reverse": false, "play_interval": 1200}', 90, 3, '4位，简单干扰', 1, 1),
(6, 'auditory_memory', '6-7', 2, '{"digit_count": 5, "has_interference": true, "has_reverse": false, "play_interval": 1000}', 90, 3, '5位，无倒序', 0, 1),
(6, 'auditory_memory', '8-9', 1, '{"digit_count": 5, "has_interference": true, "has_reverse": false, "play_interval": 1000}', 120, 4, '5位，中等干扰', 1, 1),
(6, 'auditory_memory', '8-9', 2, '{"digit_count": 6, "has_interference": true, "has_reverse": true, "play_interval": 900}', 120, 3, '6位，可选倒序', 0, 1),
(6, 'auditory_memory', '10-12', 1, '{"digit_count": 6, "has_interference": true, "has_reverse": true, "play_interval": 800}', 120, 4, '6位，必须倒序', 1, 1),
(6, 'auditory_memory', '10-12', 2, '{"digit_count": 8, "has_interference": true, "has_reverse": true, "play_interval": 600}', 150, 3, '8位，高难度', 0, 1),

-- 迷宫寻路
(7, 'maze', '4-5', 1, '{"maze_size": 5, "allow_backtrack": true, "time_limit": 120, "show_hint": true}', 120, 60, '5×5迷宫，可回头', 1, 1),
(7, 'maze', '6-7', 1, '{"maze_size": 7, "allow_backtrack": true, "time_limit": 150, "show_hint": false}', 150, 50, '7×7迷宫', 1, 1),
(7, 'maze', '6-7', 2, '{"maze_size": 9, "allow_backtrack": "limited", "time_limit": 150, "show_hint": false}', 150, 40, '9×9迷宫，限回头', 0, 1),
(7, 'maze', '8-9', 1, '{"maze_size": 9, "allow_backtrack": "limited", "time_limit": 180, "show_hint": false}', 180, 50, '9×9迷宫', 1, 1),
(7, 'maze', '8-9', 2, '{"maze_size": 11, "allow_backtrack": false, "time_limit": 180, "show_hint": false}', 180, 40, '11×11迷宫', 0, 1),
(7, 'maze', '10-12', 1, '{"maze_size": 11, "allow_backtrack": false, "time_limit": 240, "show_hint": false}', 240, 50, '11×11迷宫', 1, 1),
(7, 'maze', '10-12', 2, '{"maze_size": 13, "allow_backtrack": false, "time_limit": 240, "show_hint": false}', 240, 40, '13×13迷宫', 0, 1),

-- 快速分类
(8, 'quick_sort', '4-5', 1, '{"categories": ["color"], "items_per_category": 4, "switch_frequency": 15, "duration": 30, "speed_level": 1}', 45, 10, '单维度（颜色）', 1, 1),
(8, 'quick_sort', '6-7', 1, '{"categories": ["color", "shape"], "items_per_category": 3, "switch_frequency": 12, "duration": 45, "speed_level": 2}', 60, 12, '2维度（颜色+形状）', 1, 1),
(8, 'quick_sort', '6-7', 2, '{"categories": ["color", "shape", "size"], "items_per_category": 3, "switch_frequency": 10, "duration": 45, "speed_level": 2}', 60, 10, '3维度', 0, 1),
(8, 'quick_sort', '8-9', 1, '{"categories": ["color", "shape", "size"], "items_per_category": 3, "switch_frequency": 10, "duration": 60, "speed_level": 3}', 90, 15, '3维度，中速', 1, 1),
(8, 'quick_sort', '8-9', 2, '{"categories": ["color", "shape", "size", "pattern"], "items_per_category": 3, "switch_frequency": 8, "duration": 60, "speed_level": 3}', 90, 12, '4维度', 0, 1),
(8, 'quick_sort', '10-12', 1, '{"categories": ["color", "shape", "size", "pattern"], "items_per_category": 3, "switch_frequency": 8, "duration": 90, "speed_level": 4}', 120, 18, '4维度，高速', 1, 1),
(8, 'quick_sort', '10-12', 2, '{"categories": ["color", "shape", "size", "pattern"], "items_per_category": 3, "switch_frequency": 6, "duration": 90, "speed_level": 4, "enable_speed_bonus": true}', 120, 15, '4维度，极速', 0, 1),

-- 追踪目标
(9, 'target_tracking', '4-5', 1, '{"target_count": 2, "distractor_count": 3, "change_frequency": "low", "duration": 30, "speed": "slow"}', 45, 8, '2个目标，低速', 1, 1),
(9, 'target_tracking', '6-7', 1, '{"target_count": 3, "distractor_count": 5, "change_frequency": "medium", "duration": 45, "speed": "medium"}', 60, 10, '3个目标，中速', 1, 1),
(9, 'target_tracking', '6-7', 2, '{"target_count": 4, "distractor_count": 6, "change_frequency": "medium", "duration": 45, "speed": "medium"}', 60, 8, '4个目标', 0, 1),
(9, 'target_tracking', '8-9', 1, '{"target_count": 4, "distractor_count": 7, "change_frequency": "high", "duration": 60, "speed": "medium_fast"}', 90, 12, '4个目标，高频', 1, 1),
(9, 'target_tracking', '8-9', 2, '{"target_count": 5, "distractor_count": 8, "change_frequency": "high", "duration": 60, "speed": "fast"}', 90, 10, '5个目标，快速', 0, 1),
(9, 'target_tracking', '10-12', 1, '{"target_count": 5, "distractor_count": 10, "change_frequency": "very_high", "duration": 90, "speed": "fast"}', 120, 15, '5个目标', 1, 1),
(9, 'target_tracking', '10-12', 2, '{"target_count": 6, "distractor_count": 12, "change_frequency": "chaotic", "duration": 90, "speed": "very_fast"}', 120, 12, '6个目标，混乱', 0, 1);

-- =====================================================
-- 题库扩展：补充缺失题目，达到80道题库规模
-- 添加时间：2025年5月
-- =====================================================

-- 持续注意力补充题目（需3道，共15道）
INSERT INTO `assessment_question` (`question_code`, `dimension`, `dimension_name`, `question_type`, `question_early`, `options_early`, `weight`, `sort_order`) VALUES
('Q_E_SA_01', 'sustained_attention', '持续注意力', 'single_choice', '玩拼图能坚持多久不放弃？', '[{"value":1,"label":"2分钟","score":2},{"value":2,"label":"5分钟","score":4},{"value":3,"label":"10分钟","score":6}]', 1.0, 13),
('Q_M_SA_01', 'sustained_attention', '持续注意力', 'single_choice', '阅读绘本能坚持多长时间？', '[{"value":1,"label":"5分钟","score":2},{"value":2,"label":"10分钟","score":4},{"value":3,"label":"15分钟","score":6},{"value":4,"label":"20分钟","score":8}]', 1.0, 14),
('Q_L_SA_01', 'sustained_attention', '持续注意力', 'single_choice', '上网课或线上学习能专注多久？', '[{"value":1,"label":"10分钟","score":2},{"value":2,"label":"20分钟","score":4},{"value":3,"label":"30分钟","score":6},{"value":4,"label":"40分钟","score":8}]', 1.0, 15);

-- 选择性注意力补充题目（需4道，共12道）
INSERT INTO `assessment_question` (`question_code`, `dimension`, `dimension_name`, `question_type`, `question_early`, `options_early`, `question_mid`, `options_mid`, `weight`, `sort_order`) VALUES
('Q_E_SE_01', 'selective_attention', '选择性注意力', 'single_choice', '在有很多玩具的房间里，能找到想要的玩具吗？', '[{"value":1,"label":"很难","score":2},{"value":2,"label":"有时能","score":4},{"value":3,"label":"很容易","score":6}]', NULL, NULL, 1.0, 9),
('Q_M_SE_01', 'selective_attention', '选择性注意力', 'single_choice', NULL, NULL, '在嘈杂的环境中（如餐厅）能专心做自己的事吗？', '[{"value":1,"label":"完全不能","score":2},{"value":2,"label":"偶尔能","score":4},{"value":3,"label":"完全能","score":6}]', 1.0, 10);

INSERT INTO `assessment_question` (`question_code`, `dimension`, `dimension_name`, `question_type`, `question_late`, `options_late`, `weight`, `sort_order`) VALUES
('Q_L_SE_01', 'selective_attention', '选择性注意力', 'single_choice', '课堂上能在众多声音中专注听老师讲课吗？', '[{"value":1,"label":"经常走神","score":2},{"value":2,"label":"偶尔走神","score":4},{"value":3,"label":"完全专注","score":6}]', 1.0, 11),
('Q_A_SE_01', 'selective_attention', '选择性注意力', 'single_choice', '在多人同时说话的场合，能专注于自己想听的内容吗？', '[{"value":1,"label":"完全听不清","score":2},{"value":2,"label":"需要努力","score":4},{"value":3,"label":"轻松做到","score":6}]', 1.0, 12);

-- 分配注意力补充题目（需5道，共10道）
INSERT INTO `assessment_question` (`question_code`, `dimension`, `dimension_name`, `question_type`, `question_early`, `options_early`, `weight`, `sort_order`) VALUES
('Q_E_DA_01', 'divided_attention', '分配注意力', 'single_choice', '能一边走路一边看着家长吗？', '[{"value":1,"label":"经常摔倒","score":2},{"value":2,"label":"偶尔可以","score":4},{"value":3,"label":"完全能","score":6}]', 1.0, 6);

INSERT INTO `assessment_question` (`question_code`, `dimension`, `dimension_name`, `question_type`, `question_mid`, `options_mid`, `weight`, `sort_order`) VALUES
('Q_M_DA_01', 'divided_attention', '分配注意力', 'single_choice', '能一边听故事一边画画吗？', '[{"value":1,"label":"完全不行","score":2},{"value":2,"label":"偶尔可以","score":4},{"value":3,"label":"经常可以","score":6}]', 1.0, 7);

INSERT INTO `assessment_question` (`question_code`, `dimension`, `dimension_name`, `question_type`, `question_late`, `options_late`, `weight`, `sort_order`) VALUES
('Q_L_DA_01', 'divided_attention', '分配注意力', 'single_choice', '做课堂笔记时能同时听老师讲解吗？', '[{"value":1,"label":"完全不行","score":2},{"value":2,"label":"偶尔可以","score":4},{"value":3,"label":"经常可以","score":6}]', 1.0, 8),
('Q_L_DA_02', 'divided_attention', '分配注意力', 'single_choice', '吃饭时能一边吃一边聊天吗？', '[{"value":1,"label":"经常噎到","score":2},{"value":2,"label":"偶尔可以","score":4},{"value":3,"label":"完全没问题","score":6}]', 1.0, 9);

INSERT INTO `assessment_question` (`question_code`, `dimension`, `dimension_name`, `question_type`, `question_all`, `options_all`, `weight`, `sort_order`) VALUES
('Q_A_DA_01', 'divided_attention', '分配注意力', 'single_choice', '同时处理多项任务（如边做作业边听音乐）效率如何？', '[{"value":1,"label":"效率很低","score":2},{"value":2,"label":"效率一般","score":4},{"value":3,"label":"效率很高","score":6}]', 1.0, 10);

-- 转移注意力补充题目（需3道，共10道）
INSERT INTO `assessment_question` (`question_code`, `dimension`, `dimension_name`, `question_type`, `question_early`, `options_early`, `weight`, `sort_order`) VALUES
('Q_E_AS_01', 'attention_shifting', '转移注意力', 'single_choice', '从玩玩具切换到吃饭需要多久？', '[{"value":1,"label":"大哭大闹","score":2},{"value":2,"label":"需要几分钟","score":4},{"value":3,"label":"很快就转换","score":6}]', 1.0, 8);

INSERT INTO `assessment_question` (`question_code`, `dimension`, `dimension_name`, `question_type`, `question_mid`, `options_mid`, `weight`, `sort_order`) VALUES
('Q_M_AS_01', 'attention_shifting', '转移注意力', 'single_choice', '完成一项作业后能快速切换到下一项吗？', '[{"value":1,"label":"很慢，需要很久","score":2},{"value":2,"label":"有时需要几分钟","score":4},{"value":3,"label":"很快就切换","score":6}]', 1.0, 9);

INSERT INTO `assessment_question` (`question_code`, `dimension`, `dimension_name`, `question_type`, `question_late`, `options_late`, `weight`, `sort_order`) VALUES
('Q_L_AS_01', 'attention_shifting', '转移注意力', 'single_choice', '上课科目切换时需要多久适应？', '[{"value":1,"label":"很久才能适应","score":2},{"value":2,"label":"需要几分钟","score":4},{"value":3,"label":"很快适应","score":6}]', 1.0, 10);

-- 工作记忆补充题目（需3道，共12道）
INSERT INTO `assessment_question` (`question_code`, `dimension`, `dimension_name`, `question_type`, `question_early`, `options_early`, `weight`, `sort_order`) VALUES
('Q_E_WM_01', 'working_memory', '工作记忆', 'single_choice', '能记住"去房间拿玩具熊"这样的指令吗？', '[{"value":1,"label":"完全记不住","score":2},{"value":2,"label":"需要提醒","score":4},{"value":3,"label":"完全能记住","score":6}]', 1.0, 10);

INSERT INTO `assessment_question` (`question_code`, `dimension`, `dimension_name`, `question_type`, `question_mid`, `options_mid`, `weight`, `sort_order`) VALUES
('Q_M_WM_01', 'working_memory', '工作记忆', 'single_choice', '能在心里记住朋友家的门牌号吗？', '[{"value":1,"label":"完全记不住","score":2},{"value":2,"label":"需要写下来","score":4},{"value":3,"label":"能记住","score":6}]', 1.0, 11);

INSERT INTO `assessment_question` (`question_code`, `dimension`, `dimension_name`, `question_type`, `question_late`, `options_late`, `weight`, `sort_order`) VALUES
('Q_L_WM_01', 'working_memory', '工作记忆', 'single_choice', '心算两位数加减法有困难吗？', '[{"value":1,"label":"经常出错","score":2},{"value":2,"label":"有时需要想","score":4},{"value":3,"label":"很轻松","score":6}]', 1.0, 12);

-- 冲动控制补充题目（需4道，共12道）
INSERT INTO `assessment_question` (`question_code`, `dimension`, `dimension_name`, `question_type`, `question_early`, `options_early`, `weight`, `sort_order`) VALUES
('Q_E_IC_01', 'impulse_control', '冲动控制', 'single_choice', '看到喜欢吃的零食会马上去拿吗？', '[{"value":1,"label":"马上抢","score":2},{"value":2,"label":"犹豫一下","score":4},{"value":3,"label":"等一等","score":6}]', 1.0, 9);

INSERT INTO `assessment_question` (`question_code`, `dimension`, `dimension_name`, `question_type`, `question_mid`, `options_mid`, `weight`, `sort_order`) VALUES
('Q_M_IC_01', 'impulse_control', '冲动控制', 'single_choice', '课堂上能控制住不随便插话吗？', '[{"value":1,"label":"经常插话","score":2},{"value":2,"label":"偶尔插话","score":4},{"value":3,"label":"完全能控制","score":6}]', 1.0, 10);

INSERT INTO `assessment_question` (`question_code`, `dimension`, `dimension_name`, `question_type`, `question_late`, `options_late`, `weight`, `sort_order`) VALUES
('Q_L_IC_01', 'impulse_control', '冲动控制', 'single_choice', '玩游戏输了会发脾气吗？', '[{"value":1,"label":"经常大哭大闹","score":2},{"value":2,"label":"偶尔会不高兴","score":4},{"value":3,"label":"很快恢复","score":6}]', 1.0, 11);

INSERT INTO `assessment_question` (`question_code`, `dimension`, `dimension_name`, `question_type`, `question_all`, `options_all`, `weight`, `sort_order`) VALUES
('Q_A_IC_01', 'impulse_control', '冲动控制', 'single_choice', '重要场合能控制自己的表现吗？', '[{"value":1,"label":"经常失控","score":2},{"value":2,"label":"需要努力控制","score":4},{"value":3,"label":"完全能控制","score":6}]', 1.0, 12);

-- 反应速度补充题目（需7道，共12道）
INSERT INTO `assessment_question` (`question_code`, `dimension`, `dimension_name`, `question_type`, `question_early`, `options_early`, `weight`, `sort_order`) VALUES
('Q_E_RS_01', 'reaction_speed', '反应速度', 'single_choice', '听到有趣的事情会马上笑吗？', '[{"value":1,"label":"很慢","score":2},{"value":2,"label":"一般","score":4},{"value":3,"label":"很快","score":6}]', 1.0, 6),
('Q_E_RS_02', 'reaction_speed', '反应速度', 'single_choice', '看到危险会马上躲开吗？', '[{"value":1,"label":"经常反应不过来","score":2},{"value":2,"label":"有时能","score":4},{"value":3,"label":"反应很快","score":6}]', 1.0, 7);

INSERT INTO `assessment_question` (`question_code`, `dimension`, `dimension_name`, `question_type`, `question_mid`, `options_mid`, `weight`, `sort_order`) VALUES
('Q_M_RS_01', 'reaction_speed', '反应速度', 'single_choice', '抢答问题时反应快吗？', '[{"value":1,"label":"很慢","score":2},{"value":2,"label":"一般","score":4},{"value":3,"label":"很快","score":6}]', 1.0, 8),
('Q_M_RS_02', 'reaction_speed', '反应速度', 'single_choice', '玩游戏时操作反应快吗？', '[{"value":1,"label":"经常慢半拍","score":2},{"value":2,"label":"一般","score":4},{"value":3,"label":"反应很快","score":6}]', 1.0, 9);

INSERT INTO `assessment_question` (`question_code`, `dimension`, `dimension_name`, `question_type`, `question_late`, `options_late`, `weight`, `sort_order`) VALUES
('Q_L_RS_01', 'reaction_speed', '反应速度', 'single_choice', '考试时能在规定时间内完成吗？', '[{"value":1,"label":"经常做不完","score":2},{"value":2,"label":"刚好完成","score":4},{"value":3,"label":"经常提前完成","score":6}]', 1.0, 10),
('Q_L_RS_02', 'reaction_speed', '反应速度', 'single_choice', '运动比赛时反应敏捷吗？', '[{"value":1,"label":"很慢","score":2},{"value":2,"label":"一般","score":4},{"value":3,"label":"反应很快","score":6}]', 1.0, 11);

INSERT INTO `assessment_question` (`question_code`, `dimension`, `dimension_name`, `question_type`, `question_all`, `options_all`, `weight`, `sort_order`) VALUES
('Q_A_RS_01', 'reaction_speed', '反应速度', 'single_choice', '限时任务能按时完成吗？', '[{"value":1,"label":"经常超时","score":2},{"value":2,"label":"刚好完成","score":4},{"value":3,"label":"经常提前","score":6}]', 1.0, 12);
