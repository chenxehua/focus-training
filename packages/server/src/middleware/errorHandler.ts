import type { Request, Response, NextFunction } from 'express'
import { config } from '../config'

export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: number

  constructor(message: string, statusCode = 400, code = 1) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ code: 404, message: `路由 ${req.path} 不存在`, data: null })
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
      data: null,
    })
    return
  }

  // MySQL duplicate entry
  const mysqlErr = err as { code?: string; sqlMessage?: string }
  if (mysqlErr.code === 'ER_DUP_ENTRY') {
    res.status(409).json({ code: 409, message: '数据已存在', data: null })
    return
  }

  // 未知错误
  console.error('Unhandled error:', err)
  res.status(500).json({
    code: 500,
    message: config.isDev ? err.message : '服务器内部错误',
    data: null,
  })
}
