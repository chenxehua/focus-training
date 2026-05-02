-- ============================================================
-- 签到记录表
-- ============================================================
CREATE TABLE IF NOT EXISTS `check_in` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `child_id`    BIGINT UNSIGNED NOT NULL COMMENT '孩子 ID',
  `check_in_date` DATE        NOT NULL COMMENT '签到日期',
  `coins`       INT UNSIGNED  NOT NULL DEFAULT 0 COMMENT '获得专注币',
  `experience`  INT UNSIGNED  NOT NULL DEFAULT 0 COMMENT '获得经验值',
  `created_at`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_child_date` (`child_id`, `check_in_date`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_ci_child` FOREIGN KEY (`child_id`) REFERENCES `child` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='签到记录表';

-- ============================================================
-- 专注力测评表
-- ============================================================
CREATE TABLE IF NOT EXISTS `assessment` (
  `id`                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `child_id`            BIGINT UNSIGNED NOT NULL COMMENT '孩子 ID',
  `dimension`           VARCHAR(30)     NOT NULL COMMENT '维度名称',
  `score`               TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '得分 0-100',
  `assessment_date`     DATE            NOT NULL COMMENT '测评日期',
  `created_at`          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_child_dim_date` (`child_id`, `dimension`, `assessment_date`),
  KEY `idx_child_date` (`child_id`, `assessment_date`),
  CONSTRAINT `fk_assess_child` FOREIGN KEY (`child_id`) REFERENCES `child` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='专注力测评表';

-- ============================================================
-- 充值记录表（专注币）
-- ============================================================
CREATE TABLE IF NOT EXISTS `coin_transaction` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `child_id`    BIGINT UNSIGNED NOT NULL COMMENT '孩子 ID',
  `type`        ENUM('earn','spend','refund') NOT NULL COMMENT '交易类型',
  `amount`      INT             NOT NULL COMMENT '金额（正数）',
  `source`      VARCHAR(50)     NOT NULL COMMENT '来源（check_in/game/achievement/refund）',
  `description` VARCHAR(200)   DEFAULT NULL COMMENT '描述',
  `balance`     INT UNSIGNED    NOT NULL COMMENT '变动后余额',
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_child_created` (`child_id`, `created_at`),
  CONSTRAINT `fk_ct_child` FOREIGN KEY (`child_id`) REFERENCES `child` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='专注币交易表';