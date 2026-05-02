/**
 * Test mocks
 */

export function createTestUser(overrides = {}) {
  return {
    id: 1,
    openid: 'test_openid_123',
    phone: null,
    nickname: '测试用户',
    avatar: 'https://example.com/avatar.png',
    role: 'parent',
    status: 'active',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }
}

export function createTestChild(overrides = {}) {
  return {
    id: 1,
    name: '测试儿童',
    age: 8,
    gender: 'male',
    avatar: null,
    age_group: '7-9',
    level: 1,
    experience: 0,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }
}

export function createTestGame(overrides = {}) {
  return {
    id: 1,
    game_code: 'schulte',
    game_name: '舒尔特方格',
    game_type: 'visual',
    description: '视觉搜索训练',
    icon_url: '/icons/schulte.png',
    difficulty_levels: 5,
    target_age_group: '["4-6","7-9","10-12"]',
    is_free: true,
    status: 'active',
    ...overrides,
  }
}

export function createTestTrainingRecord(overrides = {}) {
  return {
    id: 1,
    child_id: 1,
    game_id: 1,
    duration_seconds: 60,
    accuracy: 85,
    score: 100,
    focus_score: 90,
    difficulty_level: 2,
    game_config: null,
    result_data: null,
    created_at: new Date(),
    ...overrides,
  }
}

export function createTestAchievement(overrides = {}) {
  return {
    id: 1,
    achievement_code: 'first_win',
    achievement_name: '首次通关',
    achievement_type: 'milestone',
    description: '完成第一次训练',
    requirement_type: 'count',
    requirement_value: 1,
    experience_reward: 50,
    is_active: true,
    ...overrides,
  }
}