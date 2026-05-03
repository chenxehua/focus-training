/**
 * 家长学院 - 问答 Model
 */
import { query, queryOne, execute } from '../config/database'

export class AcademyQuestion {
  /**
   * 获取问答列表
   */
  static async getQuestions(options: {
    categoryId?: number;
    status?: number;
    page: number;
    pageSize: number;
  }) {
    const { categoryId, status, page, pageSize } = options;
    const offset = (page - 1) * pageSize;
    
    let whereClause = 'WHERE q.is_deleted = 0';
    const params: unknown[] = [];

    if (categoryId) {
      whereClause += ' AND q.category_id = ?';
      params.push(categoryId);
    }

    if (status !== undefined) {
      whereClause += ' AND q.status = ?';
      params.push(status);
    }

    // Count total
    const countSql = `
      SELECT COUNT(*) as total FROM academy_question q ${whereClause}
    `;
    const countResult = await query<{ total: number }>(countSql, params);

    // Get questions
    const sql = `
      SELECT q.id, q.question_title, q.question_content, q.category_id,
             q.status, q.view_count, q.like_count, q.created_at,
             q.answered_at, c.category_name,
             (SELECT COUNT(*) FROM academy_answer WHERE question_id = q.id) as answer_count
      FROM academy_question q
      LEFT JOIN academy_question_category c ON q.category_id = c.id
      ${whereClause}
      ORDER BY q.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const questions = await query(sql, [...params, pageSize, offset]);

    return {
      questions,
      total: countResult?.[0]?.total ?? 0,
      page,
      pageSize
    };
  }

  /**
   * 获取问题详情
   */
  static async findById(id: number) {
    const sql = `
      SELECT q.*, c.category_name
      FROM academy_question q
      LEFT JOIN academy_question_category c ON q.category_id = c.id
      WHERE q.id = ? AND q.is_deleted = 0
    `;
    return await queryOne(sql, [id]);
  }

  /**
   * 获取热门问题
   */
  static async getHotQuestions(limit: number = 10) {
    const sql = `
      SELECT q.id, q.question_title, q.view_count, q.like_count,
             c.category_name,
             (SELECT COUNT(*) FROM academy_answer WHERE question_id = q.id) as answer_count
      FROM academy_question q
      LEFT JOIN academy_question_category c ON q.category_id = c.id
      WHERE q.is_deleted = 0
      ORDER BY q.view_count DESC, q.like_count DESC
      LIMIT ?
    `;
    return await query(sql, [limit]);
  }

  /**
   * 创建提问
   */
  static async create(userId: number, data: {
    questionTitle: string;
    questionContent: string;
    categoryId: number;
    images?: string;
  }) {
    const sql = `
      INSERT INTO academy_question (user_id, question_title, question_content, category_id, images, status, created_at)
      VALUES (?, ?, ?, ?, ?, 0, NOW())
    `;
    const result = await execute(sql, [
      userId,
      data.questionTitle,
      data.questionContent,
      data.categoryId,
      data.images || null
    ]);
    return result.insertId;
  }

  /**
   * 获取问题下的回答
   */
  static async getAnswers(questionId: number, page: number = 1, pageSize: number = 10) {
    const offset = (page - 1) * pageSize;
    
    const countSql = `SELECT COUNT(*) as total FROM academy_answer WHERE question_id = ?`;
    const countResult = await query<{ total: number }>(countSql, [questionId]);

    const sql = `
      SELECT a.*, u.nickname, u.avatar,
             CASE 
               WHEN a.is_expert = 1 THEN '专家'
               WHEN a.is_official = 1 THEN '官方'
               ELSE '用户'
             END as answer_type
      FROM academy_answer a
      LEFT JOIN user u ON a.user_id = u.id
      WHERE a.question_id = ? AND a.is_deleted = 0
      ORDER BY a.is_expert DESC, a.like_count DESC, a.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const answers = await query(sql, [questionId, pageSize, offset]);

    return {
      answers,
      total: countResult?.[0]?.total ?? 0,
      page,
      pageSize
    };
  }

  /**
   * 获取问题分类
   */
  static async getCategories() {
    const sql = `
      SELECT id, category_name, icon, sort_order,
             (SELECT COUNT(*) FROM academy_question WHERE category_id = c.id AND is_deleted = 0) as question_count
      FROM academy_question_category c
      WHERE is_active = 1
      ORDER BY sort_order ASC
    `;
    return await query(sql);
  }

  /**
   * 获取专家回答
   */
  static async getExpertAnswers(limit: number = 5) {
    const sql = `
      SELECT a.*, q.question_title, q.question_content, u.nickname as expert_name
      FROM academy_answer a
      JOIN academy_question q ON a.question_id = q.id
      JOIN user u ON a.user_id = u.id
      WHERE a.is_expert = 1 AND a.is_deleted = 0
      ORDER BY a.created_at DESC
      LIMIT ?
    `;
    return await query(sql, [limit]);
  }
}

export default AcademyQuestion;