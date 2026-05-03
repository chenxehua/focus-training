/**
 * 家长学院 - 文章分类 Model
 */
import { query, queryOne } from '../config/database'

export class AcademyCategory {
  static async findAll() {
    const sql = `
      SELECT id, category_name, category_icon, sort_order, 
             article_count, created_at
      FROM academy_category 
      WHERE is_active = 1
      ORDER BY sort_order ASC
    `;
    return await query(sql);
  }

  static async findById(id: number) {
    const sql = `
      SELECT * FROM academy_category WHERE id = ? AND is_active = 1
    `;
    return await queryOne(sql, [id]);
  }

  static async getCategoryWithArticles(categoryId: number, page: number = 1, pageSize: number = 10) {
    const offset = (page - 1) * pageSize;
    
    // Get category info
    const categorySql = `
      SELECT * FROM academy_category WHERE id = ? AND is_active = 1
    `;
    const categories = await query(categorySql, [categoryId]);
    if (categories.length === 0) return null;
    
    // Get articles
    const articlesSql = `
      SELECT id, title, cover_image, summary, author, 
             read_count, like_count, publish_date,
             is_featured, reading_time
      FROM academy_article 
      WHERE category_id = ? AND is_published = 1 AND is_deleted = 0
      ORDER BY is_featured DESC, publish_date DESC
      LIMIT ? OFFSET ?
    `;
    const articles = await query(articlesSql, [categoryId, pageSize, offset]);
    
    // Get total count
    const countSql = `
      SELECT COUNT(*) as total FROM academy_article 
      WHERE category_id = ? AND is_published = 1 AND is_deleted = 0
    `;
    const countResult = await query<{ total: number }>(countSql, [categoryId]);
    
    return {
      category: categories[0],
      articles,
      total: countResult?.[0]?.total ?? 0,
      page,
      pageSize
    };
  }
}

export default AcademyCategory;