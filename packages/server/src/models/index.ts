/**
 * 模型统一导出
 * 导出所有数据模型类
 */

import { UserModel } from './User'
import { ChildModel } from './Child'
import { TrainingRecordModel } from './TrainingRecord'
import { FocusReportModel } from './FocusReport'
import { GameModel } from './Game'
import { AchievementModel } from './Achievement'
import { MembershipModel, OrderModel } from './Membership'

// 导出所有模型类
export {
  UserModel,
  ChildModel,
  TrainingRecordModel,
  FocusReportModel,
  GameModel,
  AchievementModel,
  MembershipModel,
  OrderModel
}

// 默认导出
export default {
  UserModel,
  ChildModel,
  TrainingRecordModel,
  FocusReportModel,
  GameModel,
  AchievementModel,
  MembershipModel,
  OrderModel
}