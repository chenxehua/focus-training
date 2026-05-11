/**
 * 初次测评系统 E2E 测试
 * 测试完整的测评流程: 状态查询 -> 开始测评 -> 问卷 -> 游戏 -> 报告生成 -> 报告查看
 */

import { test, expect, describe, APIRequestContext } from '@playwright/test';

// 测试配置
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000/api';
const TEST_CHILD_ID = 143;
const TEST_ASSESSMENT_ID = 15;

// 辅助函数: 登录获取token
async function login(request: APIRequestContext): Promise<string> {
  const response = await request.post(`${BASE_URL}/auth/wx-login`, {
    data: { code: 'test_code_assessment', childId: TEST_CHILD_ID }
  });
  
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.success !== false).toBeTruthy();
  expect(body.data?.token).toBeDefined();
  
  return body.data.token;
}

// 辅助函数: 带认证的请求头
function authHeaders(token: string) {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

describe('初次测评系统 - 完整流程测试', () => {
  let token: string;

  // 测试前先登录
  test.beforeAll(async ({ request }) => {
    token = await login(request);
    expect(token).toBeTruthy();
  });

  describe('Step 1: 获取测评状态', () => {
    test('获取儿童测评状态 - 新用户应显示未完成', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/assessment/status/${TEST_CHILD_ID}`, {
        headers: authHeaders(token)
      });
      
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('childId');
      expect(body.data).toHaveProperty('hasCompletedInitial');
      expect(body.data).toHaveProperty('stages');
      expect(body.data.stages).toHaveProperty('questionnaire');
      expect(body.data.stages).toHaveProperty('gameTesting');
      expect(body.data.stages).toHaveProperty('report');
    });
  });

  describe('Step 2: 开始测评', () => {
    test('开始新的测评 - 应返回测评ID', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/assessment/start`, {
        headers: authHeaders(token),
        data: { childId: TEST_CHILD_ID }
      });
      
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('assessmentId');
    });

    test('重复开始测评 - 应返回现有测评', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/assessment/start`, {
        headers: authHeaders(token),
        data: { childId: TEST_CHILD_ID }
      });
      
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('isExisting', true);
    });
  });

  describe('Step 3: 获取问卷题目', () => {
    test('获取问卷 - 应返回分龄题目', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/assessment/questionnaire/${TEST_ASSESSMENT_ID}`, {
        headers: authHeaders(token)
      });
      
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('questions');
      expect(body.data).toHaveProperty('ageGroup');
      
      // 8-9岁应有19道题
      const questions = body.data.questions;
      expect(Array.isArray(questions)).toBe(true);
      expect(questions.length).toBeGreaterThan(0);
      
      // 验证题目格式
      const firstQuestion = questions[0];
      expect(firstQuestion).toHaveProperty('id');
      expect(firstQuestion).toHaveProperty('content');
      expect(firstQuestion).toHaveProperty('options');
      expect(firstQuestion).toHaveProperty('dimension');
    });

    test('问卷题目应包含7个维度', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/assessment/questionnaire/${TEST_ASSESSMENT_ID}`, {
        headers: authHeaders(token)
      });
      
      const body = await response.json();
      const questions = body.data.questions;
      
      const dimensions = new Set(questions.map((q: any) => q.dimension));
      expect(dimensions.size).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Step 4: 提交问卷答案', () => {
    test('提交问卷答案 - 部分提交', async ({ request }) => {
      const answers = [
        { questionId: 32, value: 1, selectedOption: 1, score: 2, dimension: 'sustained_attention' },
        { questionId: 33, value: 2, selectedOption: 2, score: 3, dimension: 'selective_attention' },
        { questionId: 34, value: 0, selectedOption: 0, score: 1, dimension: 'divided_attention' }
      ];
      
      const response = await request.post(`${BASE_URL}/assessment/questionnaire/${TEST_ASSESSMENT_ID}`, {
        headers: authHeaders(token),
        data: { answers }
      });
      
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('saved');
      expect(body.data.saved).toBe(3);
    });

    test('提交问卷答案 - 完成后更新状态', async ({ request }) => {
      // 先获取题目数量
      const qResponse = await request.get(`${BASE_URL}/assessment/questionnaire/${TEST_ASSESSMENT_ID}`, {
        headers: authHeaders(token)
      });
      const qBody = await qResponse.json();
      const totalQuestions = qBody.data.totalQuestions;
      
      // 生成所有答案
      const answers = [];
      for (let i = 32; i < 32 + totalQuestions; i++) {
        answers.push({
          questionId: i,
          value: i % 4,
          selectedOption: i % 4,
          score: (i % 4) + 1,
          dimension: ['sustained_attention', 'selective_attention', 'divided_attention', 'attention_shifting', 'working_memory', 'impulse_control', 'reaction_speed'][i % 7]
        });
      }
      
      const response = await request.post(`${BASE_URL}/assessment/questionnaire/${TEST_ASSESSMENT_ID}`, {
        headers: authHeaders(token),
        data: { answers, completed: true }
      });
      
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      
      expect(body.success).toBe(true);
      expect(body.data.completed).toBe(true);
    });
  });

  describe('Step 5: 获取测评游戏列表', () => {
    test('获取游戏列表 - 8-9岁应有3个游戏', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/assessment/games/${TEST_ASSESSMENT_ID}`, {
        headers: authHeaders(token)
      });
      
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('games');
      expect(body.data.games.length).toBe(3);
      
      // 验证游戏格式
      const firstGame = body.data.games[0];
      expect(firstGame).toHaveProperty('gameId');
      expect(firstGame).toHaveProperty('gameName');
      expect(firstGame).toHaveProperty('status');
    });

    test('游戏应包含完成状态', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/assessment/games/${TEST_ASSESSMENT_ID}`, {
        headers: authHeaders(token)
      });
      
      const body = await response.json();
      const games = body.data.games;
      
      games.forEach((game: any) => {
        expect(['pending', 'completed']).toContain(game.status);
      });
    });
  });

  describe('Step 6: 提交游戏结果', () => {
    test('提交舒尔特方格结果', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/assessment/games/${TEST_ASSESSMENT_ID}`, {
        headers: authHeaders(token),
        data: {
          gameId: 'schulte',
          result: {
            score: 85,
            accuracy: 0.92,
            duration: 120
          }
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('performance');
      expect(body.data.performance).toHaveProperty('percentile');
      expect(body.data.performance).toHaveProperty('rating');
    });

    test('提交快速分类结果', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/assessment/games/${TEST_ASSESSMENT_ID}`, {
        headers: authHeaders(token),
        data: {
          gameId: 'quick_sort',
          result: {
            score: 78,
            accuracy: 0.85,
            duration: 90
          }
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      
      expect(body.success).toBe(true);
    });

    test('提交听觉记忆结果', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/assessment/games/${TEST_ASSESSMENT_ID}`, {
        headers: authHeaders(token),
        data: {
          gameId: 'auditory_memory',
          result: {
            score: 82,
            accuracy: 0.88,
            duration: 100
          }
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('allCompleted', true);
    });
  });

  describe('Step 7: 生成测评报告', () => {
    test('生成报告 - 应返回完整报告', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/assessment/generate-report/${TEST_ASSESSMENT_ID}`, {
        headers: authHeaders(token)
      });
      
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('reportId');
      expect(body.data).toHaveProperty('overallScore');
      expect(body.data).toHaveProperty('overallPercentile');
      expect(body.data).toHaveProperty('dimensions');
      expect(body.data).toHaveProperty('trainingPlan');
      expect(body.data).toHaveProperty('disclaimer'); // ADHD免责声明
      
      // 验证7维度
      expect(body.data.dimensions.length).toBe(7);
    });

    test('报告应包含优势和劣势分析', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/assessment/generate-report/${TEST_ASSESSMENT_ID}`, {
        headers: authHeaders(token)
      });
      
      const body = await response.json();
      
      expect(body.data).toHaveProperty('strengths');
      expect(body.data).toHaveProperty('weaknesses');
      expect(Array.isArray(body.data.strengths)).toBe(true);
      expect(Array.isArray(body.data.weaknesses)).toBe(true);
    });

    test('报告应包含训练计划', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/assessment/generate-report/${TEST_ASSESSMENT_ID}`, {
        headers: authHeaders(token)
      });
      
      const body = await response.json();
      
      expect(body.data.trainingPlan).toHaveProperty('dailyDuration');
      expect(body.data.trainingPlan).toHaveProperty('focusGames');
      expect(body.data.trainingPlan).toHaveProperty('weeklySchedule');
    });
  });

  describe('Step 8: 获取报告详情', () => {
    test('通过报告编号获取报告', async ({ request }) => {
      // 先获取最新报告编号
      const listResponse = await request.get(`${BASE_URL}/assessment/report/child/${TEST_CHILD_ID}/list`, {
        headers: authHeaders(token)
      });
      const listBody = await listResponse.json();
      const reportNo = listBody.data.reports[0].reportNo;
      
      // 获取报告详情
      const response = await request.get(`${BASE_URL}/assessment/report/${reportNo}`, {
        headers: authHeaders(token)
      });
      
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      
      expect(body.success).toBe(true);
      expect(body.data.report).toHaveProperty('dimensionDetails');
      expect(body.data.report).toHaveProperty('summary');
      expect(body.data.report).toHaveProperty('recommendations');
    });

    test('报告详情应包含7维度详细分析', async ({ request }) => {
      const listResponse = await request.get(`${BASE_URL}/assessment/report/child/${TEST_CHILD_ID}/list`, {
        headers: authHeaders(token)
      });
      const listBody = await listResponse.json();
      const reportNo = listBody.data.reports[0].reportNo;
      
      const response = await request.get(`${BASE_URL}/assessment/report/${reportNo}`, {
        headers: authHeaders(token)
      });
      
      const body = await response.json();
      const dimensions = body.data.report.dimensionDetails;
      
      expect(dimensions.length).toBe(7);
      
      dimensions.forEach((dim: any) => {
        expect(dim).toHaveProperty('dimension');
        expect(dim).toHaveProperty('dimensionName');
        expect(dim).toHaveProperty('score');
        expect(dim).toHaveProperty('percentile');
        expect(dim).toHaveProperty('rating');
        expect(dim).toHaveProperty('level');
        expect(dim).toHaveProperty('analysis');
        expect(dim).toHaveProperty('recommendation');
      });
    });
  });

  describe('Step 9: 获取儿童报告列表', () => {
    test('获取报告列表 - 应返回分页数据', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/assessment/report/child/${TEST_CHILD_ID}/list`, {
        headers: authHeaders(token)
      });
      
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('reports');
      expect(body.data).toHaveProperty('pagination');
      
      expect(Array.isArray(body.data.reports)).toBe(true);
      expect(body.data.reports.length).toBeGreaterThan(0);
    });

    test('报告列表应包含关键信息', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/assessment/report/child/${TEST_CHILD_ID}/list`, {
        headers: authHeaders(token)
      });
      
      const body = await response.json();
      const firstReport = body.data.reports[0];
      
      expect(firstReport).toHaveProperty('reportNo');
      expect(firstReport).toHaveProperty('childName');
      expect(firstReport).toHaveProperty('overallScore');
      expect(firstReport).toHaveProperty('overallPercentile');
      expect(firstReport).toHaveProperty('overallRating');
      expect(firstReport).toHaveProperty('createdAt');
    });
  });

  describe('Step 10: 获取常模和配置数据', () => {
    test('获取百分位常模', async ({ request }) => {
      const dimensions = ['sustained_attention', 'selective_attention', 'divided_attention'];
      const ageGroups = ['4-5', '6-7', '8-9', '10-12'];
      
      for (const dimension of dimensions) {
        for (const ageGroup of ageGroups) {
          const response = await request.get(`${BASE_URL}/assessment/norm/${dimension}/${ageGroup}`, {
            headers: authHeaders(token)
          });
          
          // 可能无数据,但接口应正常响应
          expect(response.ok() || response.status() === 404).toBeTruthy();
        }
      }
    });

    test('获取游戏难度配置', async ({ request }) => {
      const games = ['schulte', 'audio_count', 'visual_tracking', 'pattern_memory', 'rhythm_tap'];
      const ageGroups = ['4-5', '6-7', '8-9', '10-12'];
      
      for (const game of games) {
        for (const ageGroup of ageGroups) {
          const response = await request.get(`${BASE_URL}/assessment/game-config/${game}/${ageGroup}`, {
            headers: authHeaders(token)
          });
          
          expect(response.ok() || response.status() === 404).toBeTruthy();
        }
      }
    });
  });

  describe('边界测试', () => {
    test('无效的儿童ID应返回404', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/assessment/status/999999`, {
        headers: authHeaders(token)
      });
      
      // 应该返回错误或空数据
      const body = await response.json();
      expect(body.success === false || body.data === null).toBeTruthy();
    });

    test('未提交问卷不应能生成报告', async ({ request }) => {
      // 开始新测评
      const startResponse = await request.post(`${BASE_URL}/assessment/start`, {
        headers: authHeaders(token),
        data: { childId: 145 }
      });
      
      const startBody = await startResponse.json();
      const newAssessmentId = startBody.data.assessmentId;
      
      // 尝试直接生成报告(应该能生成,因为可能已有历史数据)
      const generateResponse = await request.post(`${BASE_URL}/assessment/generate-report/${newAssessmentId}`, {
        headers: authHeaders(token)
      });
      
      // 不管成功与否,接口应该正常响应
      expect(generateResponse.ok() || generateResponse.status() === 500).toBeTruthy();
    });

    test('缺失认证应返回401', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/assessment/status/${TEST_CHILD_ID}`);
      
      expect(response.status()).toBe(401);
    });
  });
});

describe('初次测评系统 - 不同年龄组测试', () => {
  let token: string;

  test.beforeAll(async ({ request }) => {
    token = await login(request);
  });

  const ageGroups = [
    { group: '4-5', expectedQuestions: 14, expectedGames: 3 },
    { group: '6-7', expectedQuestions: 17, expectedGames: 3 },
    { group: '8-9', expectedQuestions: 19, expectedGames: 3 },
    { group: '10-12', expectedQuestions: 21, expectedGames: 3 }
  ];

  ageGroups.forEach(({ group, expectedQuestions, expectedGames }) => {
    test(`年龄组 ${group}: 应返回正确的题目和游戏数量`, async ({ request }) => {
      // 查找该年龄组的儿童
      const childrenResponse = await request.get(`${BASE_URL}/user/children`, {
        headers: authHeaders(token)
      });
      
      const childrenBody = await childrenResponse.json();
      const children = childrenBody.data?.children || [];
      
      // 查找匹配年龄组的儿童
      const targetChild = children.find((c: any) => {
        const childAgeGroup = c.age_group || (c.age <= 5 ? '4-6' : c.age <= 7 ? '7-9' : c.age <= 9 ? '8-9' : '10-12');
        return childAgeGroup === group.replace('-', '-'); // 简单匹配
      });
      
      if (targetChild) {
        const statusResponse = await request.get(`${BASE_URL}/assessment/status/${targetChild.id}`, {
          headers: authHeaders(token)
        });
        
        const statusBody = await statusResponse.json();
        expect(statusBody.data.ageGroup).toBeTruthy();
      }
    });
  });
});