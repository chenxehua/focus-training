/**
 * 家长学院 - 文章 Model
 */
import { query, queryOne, execute } from '../config/database'

export class AcademyArticle {
  /**
   * 获取文章详情
   */
  static async findById(id: number) {
    const sql = `
      SELECT a.*, c.category_name, c.category_name_en
      FROM academy_article a
      LEFT JOIN academy_category c ON a.category_id = c.id
      WHERE a.id = ? AND a.is_published = 1 AND a.is_deleted = 0
    `;
    const results = await query(sql, [id]);
    return results[0] || null;
  }

  /**
   * 增加阅读数
   */
  static async incrementReadCount(id: number) {
    const sql = `
      UPDATE academy_article 
      SET read_count = read_count + 1 
      WHERE id = ?
    `;
    await execute(sql, [id]);
  }

  /**
   * 获取热门文章
   */
  static async getHotArticles(limit: number = 5) {
    const sql = `
      SELECT id, title, cover_image, summary, 
             read_count, publish_date, reading_time
      FROM academy_article 
      WHERE is_published = 1 AND is_deleted = 0
      ORDER BY read_count DESC, publish_date DESC
      LIMIT ?
    `;
    return await query(sql, [limit]);
  }

  /**
   * 获取推荐文章
   */
  static async getRecommendedArticles(childId: number, limit: number = 5) {
    // 基于用户训练薄弱维度推荐相关文章
    const sql = `
      SELECT a.id, a.title, a.cover_image, a.summary, 
             a.read_count, a.publish_date, a.reading_time,
             a.tags
      FROM academy_article a
      WHERE a.is_published = 1 AND a.is_deleted = 0
      ORDER BY a.is_featured DESC, a.publish_date DESC
      LIMIT ?
    `;
    return await query(sql, [limit]);
  }

  /**
   * 获取文章列表（支持分类、标签搜索）
   */
  static async getArticles(options: {
    categoryId?: number;
    tag?: string;
    keyword?: string;
    page: number;
    pageSize: number;
  }) {
    const { categoryId, tag, keyword, page, pageSize } = options;
    const offset = (page - 1) * pageSize;
    
    let whereClause = 'WHERE a.is_published = 1 AND a.is_deleted = 0';
    const params: unknown[] = [];

    if (categoryId) {
      whereClause += ' AND a.category_id = ?';
      params.push(categoryId);
    }

    if (tag) {
      whereClause += ' AND a.tags LIKE ?';
      params.push(`%${tag}%`);
    }

    if (keyword) {
      whereClause += ' AND (a.title LIKE ? OR a.summary LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    // Count total
    const countSql = `
      SELECT COUNT(*) as total FROM academy_article a ${whereClause}
    `;
    const countResult = await query<{ total: number }>(countSql, params);

    // Get articles
    const sql = `
      SELECT a.id, a.title, a.cover_image, a.summary, a.author,
             a.read_count, a.like_count, a.publish_date,
             a.is_featured, a.reading_time, a.tags,
             c.category_name
      FROM academy_article a
      LEFT JOIN academy_category c ON a.category_id = c.id
      ${whereClause}
      ORDER BY a.is_featured DESC, a.publish_date DESC
      LIMIT ? OFFSET ?
    `;
    const articles = await query(sql, [...params, pageSize, offset]);

    const total = countResult?.[0]?.total ?? 0;
    return {
      articles,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  /**
   * 获取文章的所有标签
   */
  static async getAllTags() {
    const sql = `
      SELECT DISTINCT tags FROM academy_article 
      WHERE is_published = 1 AND is_deleted = 0 AND tags IS NOT NULL
    `;
    const results = await query(sql);
    
    // 合并所有标签
    const allTags = new Set<string>();
    results.forEach((row: { tags?: string }) => {
      if (row.tags) {
        row.tags.split(',').forEach((tag: string) => {
          allTags.add(tag.trim());
        });
      }
    });
    
    return Array.from(allTags);
  }

  /**
   * 获取相关文章（同分类或同标签）
   */
  static async getRelatedArticles(articleId: number, limit: number = 5) {
    const article = await this.findById(articleId);
    if (!article) return [];

    const sql = `
      SELECT id, title, cover_image, summary, read_count, publish_date
      FROM academy_article 
      WHERE is_published = 1 AND is_deleted = 0 AND id != ?
      AND (category_id = ? OR tags LIKE ?)
      ORDER BY read_count DESC
      LIMIT ?
    `;
    const tags = (article as Record<string, unknown>).tags || '';
    return await query(sql, [articleId, (article as Record<string, unknown>).category_id, `%${tags}%`, limit]);
  }
}

export default AcademyArticle;